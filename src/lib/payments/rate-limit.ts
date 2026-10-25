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
 * Checks stored attempt counts and reserves a log row in one database
 * transaction. The RPC takes advisory locks for every relevant scope so
 * concurrent requests cannot all pass the same count check.
 */
export async function reservePaymentAttempt(
  admin: SupabaseClient,
  input: PaymentAttemptReservation,
): Promise<ReservationResult> {
  const { data, error } = await admin.rpc("reserve_payment_attempt", {
    p_reference: input.reference,
    p_user_id: input.userId,
    p_product: input.product,
    p_channel: input.channel,
    p_reference_max: input.referenceLimit.max,
    p_reference_minutes: input.referenceLimit.minutes,
    p_user_max: input.userLimit.max,
    p_user_minutes: input.userLimit.minutes,
    p_msisdn_hash: input.msisdnHash ?? null,
    p_msisdn_max: input.msisdnLimit?.max ?? null,
    p_msisdn_minutes: input.msisdnLimit?.minutes ?? null,
    p_message: input.message ?? null,
  });

  if (error) throw new Error("Unable to reserve payment attempt.");

  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: unknown; attempt_id?: unknown; limited_scope?: unknown }
    | null;
  if (!row || typeof row.allowed !== "boolean") {
    throw new Error("Payment attempt reservation returned an invalid result.");
  }
  if (row.allowed) {
    if (typeof row.attempt_id !== "string") {
      throw new Error("Payment attempt reservation did not return an audit ID.");
    }
    return { allowed: true, attemptId: row.attempt_id };
  }
  if (row.limited_scope === "reference" || row.limited_scope === "user" || row.limited_scope === "msisdn") {
    return { allowed: false, scope: row.limited_scope };
  }
  throw new Error("Payment attempt reservation returned an invalid limit scope.");
}

export async function updatePaymentAttempt(
  admin: SupabaseClient,
  attemptId: string,
  status: "pending" | "send_otp" | "open_url" | "success" | "failed" | "abandoned",
  message?: string | null,
  displayText?: string | null,
): Promise<void> {
  try {
    const { error } = await admin
      .from("payment_attempts")
      .update({ status, message: message ?? null, display_text: displayText ?? null })
      .eq("id", attemptId);
    if (error) {
      console.error("Payment attempt status update failed.", { attemptId, status, code: error.code });
    }
  } catch {
    // A failed audit update must not misreport the outcome of a provider call.
    console.error("Payment attempt status update threw an exception.", { attemptId, status });
  }
}
