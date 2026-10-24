import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * The scheduled keep-alive ping. Database maintenance runs inside pg_cron,
 * where it does not need an exposed SECURITY DEFINER RPC.
 *
 *   1. Keep-alive: real queries against the Supabase API. A free Supabase
 *      project is paused after a week without activity; this is activity.
 * A secret is required even though this endpoint only performs a safe ping.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 503 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Cron authentication is not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorised." }, { status: 401 });
  }

  const db = createClient(url, anonKey, { auth: { persistSession: false } });

  const ping = await db.from("property_types").select("id", { head: true, count: "exact" });

  const ok = !ping.error;
  return NextResponse.json(
    {
      ok,
      at: new Date().toISOString(),
      keepAlive: ping.error ? "failed" : "ok",
    },
    { status: ok ? 200 : 502 },
  );
}
