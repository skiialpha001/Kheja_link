import { NextResponse } from "next/server";
import { z } from "zod";

export const paymentReferenceSchema = z
  .string()
  .trim()
  .max(85)
  .regex(/^k[lh]_[a-z0-9_]{6,80}$/i, "Invalid payment reference.");

export const MAX_PAYMENT_JSON_BYTES = 16 * 1024;
export const MAX_WEBHOOK_JSON_BYTES = 64 * 1024;

type BodyReadResult =
  | { ok: true; text: string }
  | { ok: false; response: NextResponse };

/** Read JSON through a bounded stream so an untrusted Content-Length cannot bypass the limit. */
export async function readPaymentJsonText(
  request: Request,
  maxBytes = MAX_PAYMENT_JSON_BYTES,
): Promise<BodyReadResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 }),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return { ok: false, response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }) };
    }
    if (Number(contentLength) > maxBytes) {
      return { ok: false, response: NextResponse.json({ error: "Request body is too large." }, { status: 413 }) };
    }
  }

  if (!request.body) {
    return { ok: false, response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }) };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, response: NextResponse.json({ error: "Request body is too large." }, { status: 413 }) };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Could not read request body." }, { status: 400 }) };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Request body must be valid UTF-8." }, { status: 400 }) };
  }
}

export async function parsePaymentJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<{ ok: true; data: z.output<TSchema> } | { ok: false; response: NextResponse }> {
  const read = await readPaymentJsonText(request);
  if (!read.ok) return read;

  let payload: unknown;
  try {
    payload = JSON.parse(read.text);
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }) };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: "Invalid request payload." }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}
