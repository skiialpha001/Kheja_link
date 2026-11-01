import Link from "next/link";
import { MapPin } from "lucide-react";
import type { LocationRow } from "@/lib/supabase/database.types";
import { MERU_RENTAL_AREAS, MERU_RENTAL_HUB, getMeruAreaPathForLocation } from "@/lib/seo/meru-rental-areas";

export default function RentalAreaLinks({ locations }: { locations: LocationRow[] }) {
  return (
    <section aria-labelledby="rental-areas-title" className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            Meru County
          </p>
          <h2 id="rental-areas-title" className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Find long-term rentals by area
          </h2>
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
            Browse current houses, apartments, bedsitters, rooms and shops by location. Listings and availability change, so check each listing for its latest details.
          </p>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2.5" aria-label="Focused rental areas in Meru">
          <li>
            <Link
              href={MERU_RENTAL_HUB.path}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:border-blue-600 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-100 dark:hover:text-blue-300"
            >
              <MapPin aria-hidden="true" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              All Meru rentals
            </Link>
          </li>
          {MERU_RENTAL_AREAS.map((area) => (
            <li key={area.slug}>
              <Link
                href={area.path}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-blue-500 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-blue-300"
              >
                <MapPin aria-hidden="true" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {area.name}
              </Link>
            </li>
          ))}
          {locations.filter((location) => !getMeruAreaPathForLocation(location.slug)).map((location) => (
            <li key={location.id}>
              <Link
                href={`/areas/${location.slug}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-blue-500 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-blue-300"
              >
                <MapPin aria-hidden="true" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {location.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/areas" className="mt-6 inline-flex text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          Browse all rental areas in Meru
        </Link>
      </div>
    </section>
  );
}
