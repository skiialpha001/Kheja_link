import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import AdminSidebar, { type Counts } from "@/components/admin/AdminSidebar";
import AdminMfaGate from "@/components/admin/AdminMfaGate";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The Kheja_Link team's back office: a grouped sidebar (a scrolling row on
 * phones) with live counts of what needs attention, and the page beside it.
 *
 * Role checks decide what to show. The database also requires an AAL2 session
 * for admin privileges, so direct RPC and table access use the same guard.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");

  if (profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-black font-sans">
        <Navbar profile={profile} />
        <main className="pt-32 md:pt-40 pb-32 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-6 py-20">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto rotate-12">
              <ShieldCheck className="w-12 h-12 text-zinc-400" />
            </div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Admins only</h1>
            <p className="text-zinc-500 font-medium leading-relaxed">
              This area is for the Kheja_Link team. If you should have access, ask an existing admin to
              upgrade your account.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance.currentLevel !== "aal2") {
    return (
      <div className="min-h-screen bg-[#f4f4f5] px-4 py-28 font-sans dark:bg-black sm:px-6">
        <Navbar profile={profile} />
        <main className="mx-auto max-w-[88rem] pt-8">
          <AdminMfaGate />
        </main>
      </div>
    );
  }

  // What needs a person, for the badges in the sidebar.
  const { data } = await supabase.rpc("admin_overview");
  const o = (data ?? {}) as Record<string, number>;
  const counts: Counts = {
    messages: Number(o.messages_new ?? 0),
    houses: Number(o.houses_to_review ?? 0),
    refunds: Number(o.refunds_to_send ?? 0),
    duplicates: Number(o.duplicates_to_refund ?? 0),
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <Navbar profile={profile} />
      <main className="pt-28 md:pt-32 pb-24 px-4 sm:px-6">
        <div className="max-w-[88rem] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">
          <AdminSidebar counts={counts} adminName={profile.full_name ?? "Admin"} />
          <div className="flex-1 min-w-0 space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
