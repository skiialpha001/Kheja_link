import { NextResponse } from "next/server";
import { loadCheckout, paystack, serviceClient, userClient } from "@/lib/payments/paystack";
import { parsePaymentJson, paymentReferenceSchema } from "@/lib/payments/request";
import { reservePaymentAttempt, updatePaymentAttempt } from "@/lib/payments/rate-limit";
import { z } from "zod";

/**
 * Some mobile-money providers ask for a one-time code instead of a prompt on
 * the phone. When Paystack replies `send_otp`, our screen collects the code
 * and posts it here — still our UI, Paystack's API underneath.
 */

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  reference: paymentReferenceSchema,
  otp: z.string().trim().regex(/^\d{4,8}$/),
});

export async function POST(request: Request) {
  const parsed = await parsePaymentJson(request, BodySchema);
  if (!parsed.ok) return parsed.response;
  const { reference, otp } = parsed.data;

  const db = userClient(request);
  if (!db) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  const checkout = await loadCheckout(db, reference);
  if (!checkout) {
    return NextResponse.json({ error: "That payment could not be found." }, { status: 404 });
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

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "Payments are not available right now. Please try again later." }, { status: 503 });
  }

  const { data: latestAttempt, error: attemptLookupError } = await admin
    .from("payment_attempts")
    .select("status")
    .eq("reference", reference)
    .eq("user_id", user.id)
    .eq("channel", "mobile_money")
    .eq("message", "M-Pesa charge request")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (attemptLookupError) {
    return NextResponse.json({ error: "Payments are not available right now. Please try again later." }, { status: 500 });
  }
  if (latestAttempt?.status !== "send_otp") {
    return NextResponse.json(
      { error: "There is no active code request for this payment. Start the M-Pesa prompt again." },
      { status: 409 },
    );
  }

  let reservation;
  try {
    reservation = await reservePaymentAttempt(admin, {
      reference,
      userId: user.id,
      product: checkout.product,
      channel: "mobile_money",
      referenceLimit: { max: 5, minutes: 10 },
      userLimit: { max: 12, minutes: 30 },
      message: "M-Pesa OTP submission",
    });
  } catch {
    return NextResponse.json({ error: "Payments are not available right now. Please try again later." }, { status: 500 });
  }
  if (!reservation.allowed) {
    return NextResponse.json(
      { error: "Too many code submissions. Wait a few minutes before trying again." },
      { status: 429 },
    );
  }

  const submitted = await paystack<{ status?: string; display_text?: string; message?: string }>(
    "/charge/submit_otp",
    { method: "POST", body: { otp, reference } },
  );

  if (!submitted.ok || !submitted.data) {
    await updatePaymentAttempt(admin, reservation.attemptId, "failed", submitted.message);
    return NextResponse.json(
      { error: submitted.message || "That code was not accepted. Please try again." },
      { status: 400 },
    );
  }

  const status = submitted.data.status === "success" ? "success" : "pending";
  await updatePaymentAttempt(
    admin,
    reservation.attemptId,
    status,
    submitted.data.message,
    submitted.data.display_text,
  );
  return NextResponse.json({
    status,
    displayText: submitted.data.display_text ?? null,
    message: submitted.data.message ?? null,
  });
}
