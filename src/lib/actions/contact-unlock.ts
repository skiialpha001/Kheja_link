"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export type ContactUnlockCheckout = {
  reference: string | null;
  amount: number;
  currency: string;
  alreadyUnlocked: boolean;
};

/** Starts or resumes the caller's database-priced unlock. RLS and the RPC
 * verify identity, ownership, listing status, and existing entitlement. */
export async function startContactUnlockAction(
  propertyId: string,
): Promise<ActionResult<ContactUnlockCheckout>> {
  if (!z.string().uuid().safeParse(propertyId).success) {
    return { ok: false, error: "That listing could not be found." };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "Sign in to unlock this landlord's contact details." };
  }

  const { data, error } = await supabase.rpc("start_contact_unlock", {
    p_property_id: propertyId,
  });
  if (error) {
    const message = error.code === "28000"
      ? "Sign in to unlock this landlord's contact details."
      : error.code === "P0002"
        ? "This listing is no longer available."
        : "Could not start the contact unlock. Please refresh and try again.";
    return { ok: false, error: message };
  }

  const checkout = data?.[0];
  if (!checkout || !Number.isFinite(Number(checkout.amount)) || !checkout.currency) {
    return { ok: false, error: "Could not load the current contact unlock price." };
  }

  return {
    ok: true,
    data: {
      reference: checkout.reference,
      amount: Number(checkout.amount),
      currency: checkout.currency,
      alreadyUnlocked: checkout.already_unlocked,
    },
  };
}
