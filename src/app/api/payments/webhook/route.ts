import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MAX_WEBHOOK_JSON_BYTES, paymentReferenceSchema, readPaymentJsonText } from "@/lib/payments/request";
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
    !paymentReferenceSchema.safeParse(reference).success
  ) {
    // Acknowledge anything else so Paystack stops retrying.
    return NextResponse.json({ received: true });
  }

  const amountMinor = event.data?.amount;
  if (!Number.isSafeInteger(amountMinor) || Number(amountMinor) <= 0 || event.data?.currency !== "KES") {
    console.warn("Paystack webhook rejected successful charge fields.", {
      reason: "invalid_amount_or_currency",
    });
    return NextResponse.json({ error: "The successful charge is missing a valid KES amount." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // kh_ is the retired house hunting pass, kl_ the per-listing contact unlock.
  // Both are checked against what Paystack actually charged: the database
  // refuses an underpayment, and a retried event is a no-op.
  const huntingPayment = reference.startsWith("kh_");
  const { data: details, error: detailsError } = huntingPayment
    ? await admin.rpc("hunting_checkout_details", { p_reference: reference })
    : await admin.rpc("unlock_checkout_details", { p_reference: reference });
  if (detailsError) {
    console.error("Paystack webhook checkout lookup failed.", { code: detailsError.code });
    return NextResponse.json({ error: "Could not check the payment record." }, { status: 500 });
  }
  const checkout = Array.isArray(details) ? details[0] : null;
  if (!checkout) {
    console.warn("Paystack webhook has no matching checkout.");
    return NextResponse.json({ error: "The payment record is not available yet." }, { status: 500 });
  }
  if (checkout.status === "paid") return NextResponse.json({ received: true });

  const expectedAmount = Number(checkout.amount);
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    console.error("Paystack webhook checkout amount is invalid.");
    return NextResponse.json({ error: "The stored payment amount could not be verified." }, { status: 500 });
  }
  if (checkout.currency?.toUpperCase() !== "KES" || Number(amountMinor) / 100 + 0.001 < expectedAmount) {
    console.warn("Paystack webhook amount or currency does not match checkout.", {
      reason: checkout.currency?.toUpperCase() !== "KES" ? "currency_mismatch" : "amount_mismatch",
    });
    return NextResponse.json({ error: "The successful charge does not match the checkout amount or currency." }, { status: 400 });
  }

  const { data: confirmed, error } = huntingPayment
    ? await admin.rpc("confirm_hunting_payment", {
        p_reference: reference,
        p_provider: "paystack",
        p_amount_received: Number(amountMinor) / 100,
      })
    : await admin.rpc("confirm_contact_unlock", {
        p_reference: reference,
        p_provider: "paystack",
        p_amount_received: Number(amountMinor) / 100,
      });

  if (error) {
    // A non-2xx makes Paystack retry, which is what we want on a transient fault.
    console.error("Paystack webhook confirmation RPC failed.", { code: error.code });
    return NextResponse.json({ error: "Could not confirm the payment." }, { status: 500 });
  }
  if (confirmed === true) return NextResponse.json({ received: true });

  // A second delivery can race the first one. A false result is safe to
  // acknowledge only when the database already records fulfillment.
  if (huntingPayment) {
    const { data: current, error: currentError } = await admin
      .from("hunting_payments")
      .select("status")
      .eq("provider_ref", reference)
      .maybeSingle();
    if (currentError) {
      console.error("Paystack webhook fulfillment recheck failed.", { code: currentError.code });
      return NextResponse.json({ error: "Could not recheck the payment record." }, { status: 500 });
    }
    if (current?.status === "paid") return NextResponse.json({ received: true });
  } else {
    const { data: current, error: currentError } = await admin
      .from("contact_unlocks")
      .select("status, duplicate_payment")
      .eq("provider_ref", reference)
      .maybeSingle();
    if (currentError) {
      console.error("Paystack webhook fulfillment recheck failed.", { code: currentError.code });
      return NextResponse.json({ error: "Could not recheck the payment record." }, { status: 500 });
    }
    if (current?.status === "paid" || current?.duplicate_payment === true) {
      return NextResponse.json({ received: true });
    }
  }

  console.error("Paystack webhook confirmation returned false without recorded fulfillment.");
  return NextResponse.json({ error: "The payment confirmation was not recorded." }, { status: 500 });
}
