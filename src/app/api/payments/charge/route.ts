import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import {
  kenyanMsisdn,
  loadCheckout,
  localMsisdn,
  paystack,
  serviceClient,
  userClient,
} from "@/lib/payments/paystack";
import { parsePaymentJson, paymentReferenceSchema } from "@/lib/payments/request";
import { reservePaymentAttempt, updatePaymentAttempt } from "@/lib/payments/rate-limit";
import { z } from "zod";

/**
 * Starts a payment from Kheja_Link's own screens.
 *
 * The tenant picks M-Pesa and types their number in the app; this asks
 * Paystack to charge it, and hands back what to show them — usually "approve
 * the prompt on your phone", in Paystack's own words so we never invent
 * instructions that do not match what the customer sees.
 *
 * The amount is read from the pending row in our database, as the signed-in
 * tenant, so it is both correct and theirs. The app cannot influence it.
 *
 * Every attempt is logged before Paystack is asked, and limits are checked
 * against that log first, so nobody can use this endpoint to flood a phone
 * with M-Pesa prompts — theirs or anyone else's.
 */

/** Attempts allowed in a window: per payment, per account, per phone number. */
const LIMITS = {
  reference: { max: 3, minutes: 10 },
  user: { max: 6, minutes: 30 },
  msisdn: { max: 5, minutes: 30 },
} as const;

/** A one-way fingerprint of the number, so the log holds no phone numbers. */
function msisdnHash(msisdn: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Payment service is not configured.");
  return createHmac("sha256", secret)
    .update(msisdn)
    .digest("hex");
}

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  reference: paymentReferenceSchema,
  phone: z.string().trim().min(1).max(40),
});

export async function POST(request: Request) {
  const parsed = await parsePaymentJson(request, BodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const reference = body.reference;

  const phone = kenyanMsisdn(body.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a Safaricom number like 0712 345 678.", field: "phone" },
      { status: 400 },
    );
  }

  const db = userClient(request);
  if (!db) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }

  const checkout = await loadCheckout(db, reference);
  if (!checkout) {
    return NextResponse.json(
      { error: "That payment could not be found. Please start again." },
      { status: 404 },
    );
  }
  if (checkout.status === "paid") {
    return NextResponse.json({ status: "success", message: "This is already paid for." });
  }
  if (checkout.status !== "pending") {
    return NextResponse.json(
      { error: "That payment has expired. Please start again." },
      { status: 409 },
    );
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json(
      { error: "Your account has no email address, which the payment needs." },
      { status: 400 },
    );
  }

  // Without the service role nothing can be logged, limited or recorded as
  // paid, so do not take anyone's money.
  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Payments are not available right now. Please try again later." },
      { status: 503 },
    );
  }

  let reservation;
  try {
    reservation = await reservePaymentAttempt(admin, {
      reference,
      userId: user.id,
      product: checkout.product,
      channel: "mobile_money",
      referenceLimit: LIMITS.reference,
      userLimit: LIMITS.user,
      msisdnHash: msisdnHash(phone),
      msisdnLimit: LIMITS.msisdn,
      message: "M-Pesa charge request",
    });
  } catch {
    return NextResponse.json(
      { error: "Payments are not available right now. Please try again later." },
      { status: 500 },
    );
  }
  if (!reservation.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many payment attempts. Wait a few minutes, check your phone for an M-Pesa " +
          "prompt, then try again.",
      },
      { status: 429 },
    );
  }

  const recordOutcome = async (row: {
    status: "pending" | "send_otp" | "success" | "failed";
    displayText?: string | null;
    message?: string | null;
  }) => {
    await updatePaymentAttempt(admin, reservation.attemptId, row.status, row.message, row.displayText);
  };

  type Charge = { status?: string; display_text?: string; message?: string; reference?: string };

  const send = (msisdn: string) =>
    paystack<Charge>("/charge", {
      method: "POST",
      body: {
        email,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency || "KES",
        reference,
        mobile_money: { phone: msisdn, provider: "mpesa" },
        metadata: { product: checkout.product, kheja_reference: reference },
      },
    });

  // Paystack's Kenyan examples use the local 07… form; send that if it
  // objects to the international one, rather than failing a valid number.
  let charge = await send(phone);
  if (!charge.ok && /phone/i.test(charge.message)) {
    charge = await send(localMsisdn(phone));
  }

  if (!charge.ok || !charge.data) {
    await recordOutcome({ status: "failed", message: charge.message });
    return NextResponse.json(
      {
        error:
          charge.status === 503
            ? "Payments are not available right now. Please try again later."
            : charge.message || "Could not start the payment. Please try again.",
      },
      { status: charge.status === 503 ? 503 : 502 },
    );
  }

  const paystackStatus = charge.data.status ?? "pending";
  const status =
    paystackStatus === "success"
      ? "success"
      : paystackStatus === "failed"
        ? "failed"
        : paystackStatus === "send_otp"
          ? "send_otp"
          : "pending";

  await recordOutcome({
    status,
    displayText: charge.data.display_text ?? null,
    message: charge.data.message ?? paystackStatus,
  });

  return NextResponse.json({
    status,
    reference,
    amount: checkout.amount,
    currency: checkout.currency,
    // Paystack's own words for the customer, e.g. "Please approve the
    // transaction on your phone". Shown as-is inside our screen.
    displayText:
      charge.data.display_text ??
      (status === "pending"
        ? "Check your phone and enter your M-Pesa PIN to approve the payment."
        : null),
    message: charge.data.message ?? null,
  });
}
