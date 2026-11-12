"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LoaderCircle, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { startContactUnlockAction } from "@/lib/actions/contact-unlock";
import { RAPH_CONTACT, toTelephoneHref, toWhatsAppHref } from "@/lib/contact";
import { createClient } from "@/lib/supabase/client";
import type { UnlockedPropertyContact } from "@/lib/types";

type PaymentPayload = {
  status?: "success" | "pending" | "failed" | "unknown" | "send_otp";
  displayText?: string | null;
  message?: string | null;
  error?: string;
};

type PaymentPhase = "idle" | "starting" | "waiting" | "otp" | "paid";

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString("en-KE")}`;
  }
}

async function authenticatedFetch(path: string, init: RequestInit) {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }

  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({})) as PaymentPayload;
  if (!response.ok) throw new Error(payload.error ?? "The payment could not be started.");
  return payload;
}

export default function PropertyContactActions({
  propertyId,
  propertyTitle,
  propertySlug,
  ownerName,
  isVerified,
  isSignedIn,
  canUnlock,
  defaultPhone,
  unlockFee,
  currency,
  contact,
}: {
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  ownerName: string;
  isVerified: boolean;
  isSignedIn: boolean;
  canUnlock: boolean;
  defaultPhone?: string | null;
  unlockFee: number;
  currency: string;
  contact: UnlockedPropertyContact | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [otp, setOtp] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "waiting" || !reference) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const result = await authenticatedFetch(
          `/api/payments/status?reference=${encodeURIComponent(reference)}`,
          { method: "GET" },
        );
        if (stopped) return;

        if (result.status === "success") {
          setPhase("paid");
          setMessage("Payment confirmed. Loading the landlord details…");
          router.refresh();
          return;
        }
        if (result.status === "failed" || result.status === "unknown") {
          setError(result.message ?? "The payment was not completed. You can try again.");
          setPhase("idle");
          return;
        }
        if (result.displayText || result.message) {
          setMessage(result.displayText ?? result.message ?? "Waiting for your M-Pesa approval…");
        }
      } catch (cause) {
        if (stopped) return;
        const text = cause instanceof Error ? cause.message : "Payment status is temporarily unavailable.";
        if (text.includes("session has expired")) {
          setError(text);
          setPhase("idle");
          return;
        }
        setMessage("Still checking the M-Pesa payment. Keep this page open.");
      }

      if (attempts >= 120) {
        setError("We have not received confirmation yet. You can check again or contact Raph for help.");
        setPhase("idle");
        return;
      }
      timer = setTimeout(() => void poll(), 4_000);
    };

    timer = setTimeout(() => void poll(), 4_000);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [phase, reference, router]);

  async function startPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPhase("starting");

    try {
      const checkout = await startContactUnlockAction(propertyId);
      if (!checkout.ok) throw new Error(checkout.error);
      if (checkout.data.alreadyUnlocked || !checkout.data.reference) {
        setPhase("paid");
        setMessage("Your contact access is active. Refreshing the landlord details…");
        router.refresh();
        return;
      }

      setReference(checkout.data.reference);
      setMessage(`Requesting ${formatPrice(checkout.data.amount, checkout.data.currency)} via M-Pesa…`);
      const result = await authenticatedFetch("/api/payments/charge", {
        method: "POST",
        body: JSON.stringify({ reference: checkout.data.reference, phone }),
      });

      if (result.status === "failed") {
        throw new Error(result.message ?? "The M-Pesa request failed. Check the number and try again.");
      }
      if (result.status === "send_otp") {
        setMessage(result.displayText ?? "Enter the one-time code sent for this payment.");
        setPhase("otp");
        return;
      }

      setMessage(result.displayText ?? "Check your phone and approve the M-Pesa prompt.");
      setPhase("waiting");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the M-Pesa payment.");
      setPhase("idle");
    }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference) return;
    setError("");
    setPhase("starting");
    try {
      const result = await authenticatedFetch("/api/payments/otp", {
        method: "POST",
        body: JSON.stringify({ reference, otp }),
      });
      setOtp("");
      setMessage(result.displayText ?? result.message ?? "Code submitted. Waiting for payment confirmation…");
      setPhase("waiting");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code could not be submitted.");
      setPhase("otp");
    }
  }

  const landlordPhone = contact?.contact_phone ?? null;
  const landlordWhatsApp = contact?.contact_whatsapp ?? landlordPhone;
  const telHref = landlordPhone ? toTelephoneHref(landlordPhone) : null;
  const whatsappHref = landlordWhatsApp
    ? toWhatsAppHref(landlordWhatsApp, `Hello, I am enquiring about ${propertyTitle} on Kheja_Link.`)
    : null;
  const raphWhatsAppHref = toWhatsAppHref(
    RAPH_CONTACT.telephone,
    `Hello Raph, I have a question about ${propertyTitle} on Kheja_Link.`,
  );
  const loginHref = `/login?next=${encodeURIComponent(`/properties/${propertySlug}#contact`)}`;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/70 dark:bg-blue-950/40 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          Direct inquiries
        </p>
        <h2 className="mt-2 text-lg font-black text-zinc-900 dark:text-white">Talk to Raph</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Ask about this listing or get help from Kheja_Link. This support line is free to contact.
        </p>
        <p className="mt-3 text-sm font-bold text-zinc-800 dark:text-zinc-100">{RAPH_CONTACT.displayTelephone}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={`tel:${RAPH_CONTACT.telephone}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-3 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Call Raph
          </a>
          {raphWhatsAppHref && (
            <a
              href={raphWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-white px-3 text-sm font-black text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-200 dark:hover:bg-blue-950"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
            {ownerName[0]?.toUpperCase() ?? "L"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black text-zinc-900 dark:text-white">{ownerName}</p>
            <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
              {isVerified ? "Verified landlord" : "Landlord"}
            </p>
          </div>
        </div>

        {contact ? (
          <div className="mt-5 space-y-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Contact unlocked
              {contact.unlocked_until && (
                <span className="ml-auto text-right text-xs font-semibold text-zinc-500">
                  Until {new Date(contact.unlocked_until).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" })}
                </span>
              )}
            </p>
            {contact.landlord_name && contact.landlord_name !== ownerName && (
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Contact: {contact.landlord_name}</p>
            )}
            {(telHref || whatsappHref) ? (
              <div className="grid grid-cols-2 gap-3">
                {telHref ? (
                  <a href={telHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-3 text-sm font-black text-white transition hover:bg-blue-800">
                    <Phone className="h-4 w-4" aria-hidden="true" /> Call landlord
                  </a>
                ) : <span />}
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-3 text-sm font-black text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">The landlord has not added a phone number for this listing. Contact Raph above for help.</p>
            )}
            {(contact.building_name || contact.address_line) && (
              <p className="flex items-start gap-2 border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                {[contact.building_name, contact.address_line].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        ) : !canUnlock ? (
          <p className="mt-5 border-t border-zinc-200 pt-5 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            This is a demo listing. It has no real landlord contact or address to unlock.
          </p>
        ) : (
          <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <Lock className="h-4 w-4 text-blue-600" aria-hidden="true" /> Landlord details are locked
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Pay once to unlock the landlord&apos;s call details and private location information for this listing.
            </p>
            <p className="mt-3 font-black text-zinc-900 dark:text-white">
              {formatPrice(unlockFee, currency)} <span className="text-xs font-semibold text-zinc-500">per listing</span>
            </p>

            {!isSignedIn ? (
              <Link
                href={loginHref}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800"
              >
                Sign in to unlock details
              </Link>
            ) : (
              <>
                {!expanded ? (
                  <button
                    type="button"
                    onClick={() => { setExpanded(true); setError(""); }}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" /> Unlock with M-Pesa
                  </button>
                ) : phase === "otp" ? (
                  <form className="mt-4 space-y-3" onSubmit={submitOtp}>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{message}</p>
                    <label htmlFor="contact-unlock-otp" className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">Payment code</label>
                    <input
                      id="contact-unlock-otp"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]{4,8}"
                      maxLength={8}
                      required
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                      className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-zinc-900 outline-none focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white">
                      Submit code
                    </button>
                  </form>
                ) : phase === "waiting" || phase === "paid" || phase === "starting" ? (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40" role="status" aria-live="polite">
                    <div className="flex items-center gap-3">
                      {phase !== "paid" && <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-blue-700 dark:text-blue-300" aria-hidden="true" />}
                      <p className="text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-200">
                        {message || "Waiting for M-Pesa payment confirmation…"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form className="mt-4 space-y-3" onSubmit={startPayment}>
                    <label htmlFor="contact-unlock-phone" className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">M-Pesa phone number</label>
                    <input
                      id="contact-unlock-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="0712 345 678"
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-zinc-900 outline-none focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    <button type="submit" disabled={phone.trim().length < 9} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Pay {formatPrice(unlockFee, currency)} with M-Pesa
                    </button>
                    <p className="text-xs leading-relaxed text-zinc-500">A payment prompt will be sent to your phone. The landlord&apos;s details appear only after the payment is verified.</p>
                  </form>
                )}
                {error && <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400" role="alert">{error}</p>}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
