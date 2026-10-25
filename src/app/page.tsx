import Link from "next/link";
import Hero from "@/components/Hero";
import HomeListings from "@/components/HomeListings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppDownloadQR from "@/components/AppDownloadQR";
import { getProperties } from "@/lib/queries/properties";
import { withFavoriteState } from "@/lib/queries/favorites";
import { getLocations } from "@/lib/queries/lookups";
import { getCurrentProfile } from "@/lib/supabase/server";

// Rendered per request: the navbar and the saved-home hearts depend on the
// visitor's session, which is read from cookies.
export const dynamic = "force-dynamic";

export default async function Home() {
  // The homepage should still render if the database is unreachable or has not
  // been migrated yet — visitors get the empty state rather than an error page.
  const [listing, locations, profile] = await Promise.all([
    getProperties({ perPage: 24, sort: "newest" }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      perPage: 24,
      pageCount: 1,
    })),
    getLocations().catch(() => []),
    getCurrentProfile().catch(() => null),
  ]);

  const properties = await withFavoriteState(listing.items).catch(() => listing.items);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <Navbar profile={profile} />

      <main className="pb-16 sm:pb-24">
        <Hero locations={locations} />

        <HomeListings properties={properties} />

        <AppDownloadQR />

        {/* Call to Action */}
        <section className="px-4 pt-12 sm:px-6 sm:pt-16">
          <div className="max-w-7xl mx-auto">
            <div className="overflow-hidden rounded-3xl bg-zinc-900 px-5 py-14 text-center shadow-lg shadow-zinc-900/10 sm:rounded-[2.5rem] sm:px-10 sm:py-20">
              <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
                <div className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-200">
                  Start Your Journey
                </div>
                <h2 className="text-balance text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  Ready to find your next home?
                </h2>
                <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-zinc-300 sm:text-lg md:text-xl">
                  Explore long-term rentals across Meru or share a property with people looking for a place to live.
                </p>
                <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/properties"
                    className="flex h-14 w-full items-center justify-center rounded-xl bg-blue-700 px-7 font-semibold text-white transition-colors hover:bg-blue-800 sm:w-auto"
                  >
                    Find a House
                  </Link>
                  <Link
                    href="/dashboard/properties/new"
                    className="flex h-14 w-full items-center justify-center rounded-xl border border-white/20 bg-transparent px-7 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    List Your Property
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
