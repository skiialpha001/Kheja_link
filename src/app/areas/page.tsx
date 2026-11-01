import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getLocations } from "@/lib/queries/lookups";
import { getCurrentProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rental Areas in Meru County",
  description:
    "Browse Kheja_Link's Meru rental areas. Find current long-term houses, apartments, bedsitters, student rooms and shops by location.",
  alternates: { canonical: "/areas" },
};

export default async function RentalAreasPage() {
  const [locations, profile] = await Promise.all([
    getLocations().catch(() => []),
    getCurrentProfile().catch(() => null),
  ]);

  const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar profile={profile} />
      <main className="px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-6xl space-y-10">
          <header className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              <span>Meru County, Kenya</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              Long-term rentals by area
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              Choose a location to browse its current rental listings. Kheja_Link covers areas recorded in its listings directory; availability changes as homes are added or rented.
            </p>
          </header>

          {sortedLocations.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedLocations.map((location) => (
                <li key={location.id}>
                  <Link
                    href={`/areas/${location.slug}`}
                    className="group flex h-full min-h-36 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span>
                      <span className="flex items-center gap-2 text-lg font-bold text-zinc-950 dark:text-white">
                        <MapPin aria-hidden="true" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        {location.name}
                      </span>
                      <span className="mt-2 block text-sm text-zinc-600 dark:text-zinc-400">
                        {[location.area, location.county].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      View rentals
                      <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Rental areas are temporarily unavailable. Browse all current listings instead.
            </p>
          )}

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Looking in another part of Meru? Search all listings and contact us to request an area be added.
          </p>
          <Link href="/properties" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">
            Search all rentals
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
