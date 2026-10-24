const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const maxBodyBytes = 4_096;

async function readLimitedBody(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return null;
  }
}

function response(status: number, body: Record<string, unknown>, origin?: string, allowed = false): Response {
  const headers = new Headers(jsonHeaders);
  if (origin && allowed) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
    headers.set("access-control-allow-headers", "authorization, apikey, content-type, x-client-info");
    headers.set("access-control-allow-methods", "POST, OPTIONS");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigin(origin: string | null): boolean {
  // Native Flutter requests normally omit Origin. Browser origins must match
  // an explicit allow-list; CORS is not used as authentication.
  if (!origin) return true;
  const allowList = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowList.includes(origin);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const originAllowed = allowedOrigin(origin);

  if (request.method === "OPTIONS") {
    if (!origin || !originAllowed) return new Response(null, { status: 403, headers: { "cache-control": "no-store" } });
    const headers = new Headers({
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-max-age": "600",
      "vary": "Origin",
    });
    return new Response(null, { status: 204, headers });
  }

  if (origin && !originAllowed) return response(403, { error: "Origin not allowed" });
  if (request.method !== "POST") return response(405, { error: "Method not allowed" }, origin ?? undefined, originAllowed);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return response(415, { error: "JSON required" }, origin ?? undefined, originAllowed);
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S{20,}$/.test(authorization) || authorization.length > 8_192) {
    return response(401, { error: "Authentication required" }, origin ?? undefined, originAllowed);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
  const callbackUrl = Deno.env.get("PAYSTACK_CALLBACK_URL");
  if (!supabaseUrl || !publishableKey || !paystackSecret || !callbackUrl) {
    return response(503, { error: "Payment service unavailable" }, origin ?? undefined, originAllowed);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return response(413, { error: "Request too large" }, origin ?? undefined, originAllowed);
  }
  const bodyText = await readLimitedBody(request);
  if (bodyText === null) return response(413, { error: "Request too large or invalid" }, origin ?? undefined, originAllowed);

  let propertyId: unknown;
  try {
    const parsed: unknown = JSON.parse(bodyText);
    propertyId = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).property_id
      : undefined;
  } catch {
    return response(400, { error: "Invalid JSON" }, origin ?? undefined, originAllowed);
  }
  if (!validUuid(propertyId)) return response(400, { error: "Invalid listing" }, origin ?? undefined, originAllowed);

  // verify_jwt is disabled only so OPTIONS can reach this handler. Auth is
  // still required: this request is checked by Supabase Auth before any write.
  const userResult = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: { apikey: publishableKey, authorization: authorization },
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!userResult?.ok) return response(401, { error: "Authentication required" }, origin ?? undefined, originAllowed);

  const user = await userResult.json().catch(() => null) as {
    id?: unknown;
    email?: unknown;
    email_confirmed_at?: unknown;
    confirmed_at?: unknown;
  } | null;
  if (!user || typeof user.id !== "string" || typeof user.email !== "string" || user.email.length > 320) {
    return response(401, { error: "Verified email required" }, origin ?? undefined, originAllowed);
  }
  if (typeof user.email_confirmed_at !== "string" && typeof user.confirmed_at !== "string") {
    return response(403, { error: "Verify your email before starting payment" }, origin ?? undefined, originAllowed);
  }

  // The database derives the user from auth.uid(), creates the reference, and
  // loads the amount/currency from a private settings row. The client cannot
  // submit a price, reference, or user ID.
  const intentResult = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/create_contact_payment_intent`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      authorization,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ p_property_id: propertyId }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!intentResult?.ok) {
    return response(409, { error: "Listing is not eligible for contact unlock" }, origin ?? undefined, originAllowed);
  }

  const intentPayload: unknown = await intentResult.json().catch(() => null);
  const intent = Array.isArray(intentPayload) ? intentPayload[0] : null;
  if (!intent || typeof intent.reference !== "string" ||
      !Number.isInteger(intent.amount_minor) || intent.amount_minor <= 0 ||
      typeof intent.currency !== "string" || !/^[A-Z]{3}$/.test(intent.currency)) {
    return response(503, { error: "Payment service unavailable" }, origin ?? undefined, originAllowed);
  }

  let callback: URL;
  try {
    callback = new URL(callbackUrl);
  } catch {
    return response(503, { error: "Payment service unavailable" }, origin ?? undefined, originAllowed);
  }
  if (callback.protocol !== "https:" && callback.hostname !== "localhost" && callback.hostname !== "127.0.0.1") {
    return response(503, { error: "Payment service unavailable" }, origin ?? undefined, originAllowed);
  }

  const paystackResult = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      authorization: `Bearer ${paystackSecret}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: String(intent.amount_minor),
      currency: intent.currency,
      reference: intent.reference,
      callback_url: callback.toString(),
      metadata: JSON.stringify({ property_id: propertyId }),
    }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  if (!paystackResult?.ok) return response(502, { error: "Could not initialize payment" }, origin ?? undefined, originAllowed);
  const paystackPayload: unknown = await paystackResult.json().catch(() => null);
  const paystackRecord = paystackPayload && typeof paystackPayload === "object"
    ? paystackPayload as Record<string, unknown>
    : undefined;
  const paymentData = paystackRecord?.data && typeof paystackRecord.data === "object"
    ? paystackRecord.data as Record<string, unknown>
    : undefined;
  const checkoutUrl = typeof paymentData?.authorization_url === "string" ? paymentData.authorization_url : "";
  if (paystackRecord?.status !== true || paymentData?.reference !== intent.reference) {
    return response(502, { error: "Could not initialize payment" }, origin ?? undefined, originAllowed);
  }
  let checkout: URL;
  try {
    checkout = new URL(checkoutUrl);
  } catch {
    return response(502, { error: "Could not initialize payment" }, origin ?? undefined, originAllowed);
  }
  if (checkout.protocol !== "https:" || checkout.hostname !== "checkout.paystack.com") {
    return response(502, { error: "Could not initialize payment" }, origin ?? undefined, originAllowed);
  }

  return response(200, {
    authorization_url: checkout.toString(),
    reference: intent.reference,
    expires_at: intent.expires_at,
  }, origin ?? undefined, originAllowed);
});
