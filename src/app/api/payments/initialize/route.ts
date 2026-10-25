import { NextResponse } from "next/server";
import { loadCheckout, serviceClient, userClient } from "@/lib/payments/paystack";
import { parsePaymentJson, paymentReferenceSchema } from "@/lib/payments/request";
import { reservePaymentAttempt, updatePaymentAttempt } from "@/lib/payments/rate-limit";
import { z } from "zod";

/**
 * Starts a card payment and returns Paystack's secure card page.
 *
 * Two products share this route, told apart by the reference prefix:
 *
 *   kl_…  the contact unlock for one listing (contact_unlock_fee, KES 500)
 *   kh_…  the retired house hunting pass — only checkouts already open
 *
 * The caller must be signed in and the payment must be theirs: the pending
 * row is read as that tenant, so Row Level Security refuses anyone else's.
 * The amount comes from that row, which the database priced from
 * app_settings, and the email is the account's own — nothing the app sends
 * changes what is charged. Only Paystack's confirmation marks it paid.
 *
 * Payments fail closed when Paystack is not configured. There is no free
 * confirmation or demo-payment path.
 */

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  reference: paymentReferenceSchema,
  propertyTitle: z.string().max(16 * 1024).optional(),
});

async function paystackCheckout(
  secret: string,
  payload: { email: string; amount: number; currency: string; reference: string; metadata: object },
  admin: NonNullable<ReturnType<typeof serviceClient>>,
  attemptId: string,
) {
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        ...payload,
        // Paystack takes the smallest currency unit.
        amount: Math.round(payload.amount * 100),
        channels: ["card"],
      }),
    });

    const body = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };

    if (!response.ok || !body.status || !body.data?.authorization_url) {
      await updatePaymentAttempt(admin, attemptId, "failed", body.message ?? "Paystack initialization failed.");
      return NextResponse.json(
        { error: body.message ?? "Could not start the payment." },
        { status: 502 },
      );
    }

    await updatePaymentAttempt(admin, attemptId, "open_url", "Paystack card checkout initialized.");
    return NextResponse.json({
      mode: "paystack",
      checkoutUrl: body.data.authorization_url,
      reference: payload.reference,
    });
  } catch {
    await updatePaymentAttempt(admin, attemptId, "failed", "Could not reach Paystack.");
    return NextResponse.json(
      { error: "Could not reach the payment provider. Please try again." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const parsed = await parsePaymentJson(request, BodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const reference = body.reference;

  const db = userClient(request);
  if (!db) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }

  const checkout = await loadCheckout(db, reference);
  if (!checkout) {
    return NextResponse.json({ error: "That payment could not be found. Please start again." }, { status: 404 });
  }
  if (checkout.status === "paid") {
    return NextResponse.json({ mode: "already_paid", paid: true, unlocked: true });
  }
  if (checkout.status !== "pending") {
    return NextResponse.json({ error: "That payment has expired. Please start again." }, { status: 409 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Payments are not available right now. Please try again later." },
      { status: 503 },
    );
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
      channel: "card",
      referenceLimit: { max: 5, minutes: 10 },
      userLimit: { max: 12, minutes: 30 },
      message: "Paystack card checkout request",
    });
  } catch {
    return NextResponse.json({ error: "Payments are not available right now. Please try again later." }, { status: 500 });
  }
  if (!reservation.allowed) {
    return NextResponse.json(
      { error: "Too many card checkout requests. Wait a few minutes before trying again." },
      { status: 429 },
    );
  }

  return paystackCheckout(secret, {
    email: user.email,
    amount: checkout.amount,
    currency: checkout.currency || "KES",
    reference,
    metadata: {
      product: checkout.product,
      property: checkout.product === "contact_unlock" ? (body.propertyTitle?.slice(0, 160) ?? null) : null,
    },
  }, admin, reservation.attemptId);
}
