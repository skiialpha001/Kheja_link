import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readPaymentJsonText, MAX_WEBHOOK_JSON_BYTES } from "@/lib/payments/request";
import { z } from "zod";

/**
 * Paystack webhook.
 *
 * Paystack signs every event with HMAC-SHA512 over the raw body using the
 * secret key. We verify that before trusting anything: without it, anyone who
 * learned the URL could unlock every listing for free.
 *
 * Point Paystack at https://<your-domain>/api/payments/webhook
 */

export const dynamic = "force-dynamic";

const PaystackEventSchema = z.object({
  event: z.string().max(128).optional(),
  data: z
    .object({
      reference: z.string().max(128).nullable().optional(),
      status: z.string().max(64).nullable().optional(),
      currency: z.string().length(3).nullable().optional(),
      amount: z.number().finite().nonnegative().nullable().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
}).passthrough();

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !supabaseUrl || !serviceKey) {
    // A 5xx asks Paystack to retry after configuration is restored.
    return NextResponse.json({ error: "Webhook is temporarily unavailable." }, { status: 500 });
  }

  // The signature covers the raw bytes, so read the body as text first.
  const body = await readPaymentJsonText(request, MAX_WEBHOOK_JSON_BYTES);
  if (!body.ok) return body.response;
  const raw = body.text;
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!z.string().regex(/^[a-f\d]{128}$/i).safeParse(signature).success) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const expected = createHmac("sha512", secret).update(raw).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const parsed = PaystackEventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  const event = parsed.data;

  const reference = event.data?.reference;

  if (
    event.event !== "charge.success" ||
    event.data?.status !== "success" ||
    !reference ||
    // Every Kheja_Link price is in shillings; anything else is not our charge.
    (event.data?.currency !== undefined && event.data.currency !== "KES")
  ) {
    // Acknowledge anything else so Paystack stops retrying.
    return NextResponse.json({ received: true });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // kh_ is the retired house hunting pass, kl_ the per-listing contact unlock.
  // Both are checked against what Paystack actually charged: the database
  // refuses an underpayment, and a retried event is a no-op.
  const amountReceived = typeof event.data?.amount === "number" ? event.data.amount / 100 : null;
  const { error } = reference.startsWith("kh_")
    ? await admin.rpc("confirm_hunting_payment", {
        p_reference: reference,
        p_provider: "paystack",
        p_amount_received: amountReceived,
      })
    : await admin.rpc("confirm_contact_unlock", {
        p_reference: reference,
        p_provider: "paystack",
        p_amount_received: amountReceived,
      });

  if (error) {
    // A non-2xx makes Paystack retry, which is what we want on a transient fault.
    return NextResponse.json({ error: "Could not confirm the payment." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
