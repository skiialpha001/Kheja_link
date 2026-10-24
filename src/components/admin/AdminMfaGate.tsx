"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GateState = "loading" | "enrolling" | "challenge";

/** Admins must enroll a TOTP factor and verify it before admin pages are shown. */
export default function AdminMfaGate() {
  const router = useRouter();
  const [state, setState] = useState<GateState>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      try {
        const supabase = createClient();
        const [{ data: aal, error: aalError }, { data: factors, error: factorsError }] =
          await Promise.all([
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
            supabase.auth.mfa.listFactors(),
          ]);
        if (aalError) throw aalError;
        if (factorsError) throw factorsError;
        if (cancelled) return;

        if (aal.currentLevel === "aal2") {
          router.refresh();
          return;
        }

        const verified = factors.totp.find((factor) => factor.status === "verified");
        if (verified) {
          setFactorId(verified.id);
          setState("challenge");
          return;
        }

        // Remove abandoned, unverified enrollments so this account has one clear setup flow.
        for (const pending of factors.totp.filter((factor) => factor.status !== "verified")) {
          const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id });
          if (removeError) throw removeError;
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Kheja_Link admin",
        });
        if (enrollError) throw enrollError;
        if (cancelled) return;
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setState("enrolling");
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not prepare multi-factor authentication.");
          setState("challenge");
        }
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6,8}$/.test(code)) {
      setError("Enter the current 6 to 8 digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;
      setCode("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The verification code was not accepted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div className="mb-5 inline-flex rounded-2xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
        Admin security check
      </div>
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
        {state === "enrolling" ? "Set up an authenticator app" : "Verify your identity"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Admin access requires a time-based code from an authenticator app. This check is enforced by the database too.
      </p>

      {state === "loading" ? (
        <p className="mt-6 text-sm text-zinc-500" role="status">Checking your security factors…</p>
      ) : (
        <>
          {state === "enrolling" && qrCode && (
            <div className="mt-6 space-y-4">
              <img className="h-48 w-48 rounded-xl border bg-white p-2" src={qrCode} alt="Authenticator setup QR code" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Scan the QR code. If scanning is unavailable, enter this key manually:</p>
              <code className="block break-all rounded-xl bg-zinc-100 p-3 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">{secret}</code>
            </div>
          )}
          <form className="mt-6 space-y-4" onSubmit={verify}>
            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200" htmlFor="admin-totp-code">
              Authenticator code
            </label>
            <input
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg tracking-[0.3em] text-zinc-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              id="admin-totp-code"
              inputMode="numeric"
              maxLength={8}
              minLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              pattern="[0-9]{6,8}"
              required
              value={code}
            />
            {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
            <button
              className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy || !factorId}
              type="submit"
            >
              {busy ? "Verifying…" : state === "enrolling" ? "Enable MFA and continue" : "Continue to admin"}
            </button>
          </form>
          {error && !factorId && (
            <button
              className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload security check
            </button>
          )}
        </>
      )}
    </section>
  );
}
