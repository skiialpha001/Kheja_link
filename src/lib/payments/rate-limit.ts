import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/payments/paystack";

type WindowLimit = { max: number; minutes: number };

export type PaymentAttemptReservation = {
  reference: string;
  userId: string;
  product: Product;
  channel: "mobile_money" | "card" | "checkout";
  referenceLimit: WindowLimit;
  userLimit: WindowLimit;
  msisdnHash?: string;
  msisdnLimit?: WindowLimit;
  message?: string;
};

export type ReservationResult =
  | { allowed: true; attemptId: string }
  | { allowed: false; scope: "reference" | "user" | "msisdn" };

/**
 * Checks stored attempt counts and reserves a log row before a provider call.
 * Any database read/write failure throws so callers can fail closed.
 */
export async function reservePaymentAttempt(
  admin: SupabaseClient,
  input: PaymentAttemptReservation,
): Promise<ReservationResult> {
  const since = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const count = async (column: "reference" | "user_id" | "msisdn_hash", value: string, limit: WindowLimit) => {
    const { count: total, error } = await admin
      .from("payment_attempts")
      .select("id", { count: "exact", head: true })
      .eq(column, value)
      .eq("channel", input.channel)
      .gte("created_at", since(limit.minutes));
    if (error || total === null) throw new Error("Unable to check payment attempt limits.");
    return total;
  };

  const checks = await Promise.all([
    count("reference", input.reference, input.referenceLimit),
    count("user_id", input.userId, input.userLimit),
    input.msisdnHash && input.msisdnLimit
      ? count("msisdn_hash", input.msisdnHash, input.msisdnLimit)
      : Promise.resolve(null),
  ]);

  if (checks[0] >= input.referenceLimit.max) return { allowed: false, scope: "reference" };
  if (checks[1] >= input.userLimit.max) return { allowed: false, scope: "user" };
  if (checks[2] !== null && input.msisdnLimit && checks[2] >= input.msisdnLimit.max) {
    return { allowed: false, scope: "msisdn" };
  }

  const { data, error } = await admin
    .from("payment_attempts")
    .insert({
      reference: input.reference,
      product: input.product,
      channel: input.channel,
      status: "pending",
      message: input.message ?? null,
      user_id: input.userId,
      msisdn_hash: input.msisdnHash ?? null,
    })
    .select("id")
    .single();
  if (error || !data?.id) throw new Error("Unable to reserve payment attempt.");
  return { allowed: true, attemptId: data.id };
}

export async function updatePaymentAttempt(
  admin: SupabaseClient,
  attemptId: string,
  status: "pending" | "send_otp" | "open_url" | "success" | "failed" | "abandoned",
  message?: string | null,
  displayText?: string | null,
): Promise<void> {
  try {
    await admin
      .from("payment_attempts")
      .update({ status, message: message ?? null, display_text: displayText ?? null })
      .eq("id", attemptId);
  } catch {
    // A failed audit update must not misreport the outcome of a provider call.
  }
}
