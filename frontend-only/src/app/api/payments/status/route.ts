import { NextResponse } from "next/server";
import { loadCheckout, serviceClient, userClient, verifyAndConfirm } from "@/lib/payments/paystack";
import { paymentReferenceSchema } from "@/lib/payments/request";
import { reservePaymentAttempt, updatePaymentAttempt } from "@/lib/payments/rate-limit";
import { z } from "zod";

/**
 * Where a payment has got to, for Kheja_Link's own "waiting for your M-Pesa
 * PIN" screen.
 *
 * It asks Paystack directly rather than believing the app, and marks our row
 * paid only on Paystack's word. That also means a payment still completes if
 * the webhook is slow or misconfigured.
 */

export const dynamic = "force-dynamic";

const QuerySchema = z.object({ reference: paymentReferenceSchema });

export async function GET(request: Request) {
  const query = QuerySchema.safeParse({ reference: new URL(request.url).searchParams.get("reference") });
  if (!query.success) {
    return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
  }
  const { reference } = query.data;

  const db = userClient(request);
  if (!db) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  // Only the tenant who started this payment may ask about it.
  const checkout = await loadCheckout(db, reference);
  if (!checkout) {
    return NextResponse.json({ error: "That payment could not be found." }, { status: 404 });
  }
  if (checkout.status === "paid") {
    return NextResponse.json({ status: "success", message: "Payment received." });
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "Payments are not available right now. Please try again later." }, { status: 503 });
  }

  let reservation;
  try {
    reservation = await reservePaymentAttempt(admin, {
      reference,
      userId: user.id,
      product: checkout.product,
      channel: "checkout",
      // The app polls every four seconds; this leaves headroom for a full wait window.
      referenceLimit: { max: 180, minutes: 10 },
      userLimit: { max: 600, minutes: 10 },
      message: "Paystack status verification",
    });
  } catch {
    return NextResponse.json({ error: "Payment status is temporarily unavailable." }, { status: 500 });
  }
  if (!reservation.allowed) {
    return NextResponse.json(
      { error: "Too many payment status checks. Wait a minute before checking again." },
      { status: 429 },
    );
  }

  const result = await verifyAndConfirm(reference, checkout);
  await updatePaymentAttempt(
    admin,
    reservation.attemptId,
    result.status === "success" ? "success" : result.status === "failed" || result.status === "unknown" ? "failed" : "pending",
    result.message,
    result.displayText,
  );
  return NextResponse.json(result);
}
