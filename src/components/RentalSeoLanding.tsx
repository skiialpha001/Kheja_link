import Link from "next/link";
import { MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { MERU_RENTAL_AREAS, type MeruRentalArea, type RentalAreaFaq } from "@/lib/seo/meru-rental-areas";
import type { PropertyListItem } from "@/lib/types";
import type { ProfileRow } from "@/lib/supabase/database.types";

export type RentalSeoLandingProps = {
  title: string;
  intro: string;
  localNote: string;
  faq: RentalAreaFaq[];
  activeArea?: MeruRentalArea;
  profile: ProfileRow | null;
  properties: PropertyListItem[];
  total: number;
  fallbackProperties?: PropertyListItem[];
  listingLoadFailed?: boolean;
};

export default function RentalSeoLanding({
  title,
  intro,
  localNote,
  faq,
  activeArea,
  profile,
  properties,
  total,
  fallbackProperties = [],
  listingLoadFailed = false,
}: RentalSeoLandingProps) {
  const shownProperties = properties.length > 0 ? properties : fallbackProperties;
  const showingFallback = properties.length === 0 && fallbackProperties.length > 0;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar profile={profile} />
      <main className="px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-7xl space-y-12">
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="underline-offset-4 hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/houses-for-rent-meru" className="underline-offset-4 hover:underline">Meru rentals</Link></li>
              {activeArea && <>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-zinc-900 dark:text-white">{activeArea.name}</li>
              </>}
            </ol>
          </nav>

          <header className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              <span>Meru County, Kenya</span>
            </div>
            <h1 className="text-balance text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{intro}</p>
          </header>

          <section aria-labelledby="rental-listings-heading" className="space-y-6">
            <div className="space-y-2">
              <h2 id="rental-listings-heading" className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                {activeArea ? `Current rentals in ${activeArea.name}` : "Current rentals across Meru County"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {total > 0
                  ? `${total} published listing${total === 1 ? "" : "s"} currently match this area.`
                  : activeArea
                    ? "No published listings currently match this area. Availability changes as listers update their properties."
                    : "There are no published rental listings to show right now."}
              </p>
            </div>

            {listingLoadFailed ? (
              <p role="status" className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                We could not load rentals right now. Please refresh in a moment.
              </p>
            ) : shownProperties.length > 0 ? (
              <>
                {showingFallback && (
                  <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    These are other published rentals across Meru, not confirmed listings in {activeArea?.name}. Check each property's area and confirm details with its lister.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {shownProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Browse another area below or search the full rental directory.
              </p>
            )}
            <Link href="/properties" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">
              Search all Meru rentals
            </Link>
          </section>

          <section aria-labelledby="area-guide-heading" className="max-w-4xl space-y-4">
            <h2 id="area-guide-heading" className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
              {activeArea ? `Renting in ${activeArea.name}` : "Renting in Meru County"}
            </h2>
            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{localNote}</p>
            {activeArea?.officialContextLink && (
              <a
                href={activeArea.officialContextLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-400"
              >
                {activeArea.officialContextLink.label} (official site)
              </a>
            )}
            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
              Rent and property details are taken from each listing. Ask the lister to confirm availability, exact directions, deposit, utility arrangements and any other charges before you pay or travel.
            </p>
          </section>

          <section aria-labelledby="other-areas-heading" className="space-y-5">
              <h2 id="other-areas-heading" className="text-2xl font-bold text-zinc-950 dark:text-white">
                {activeArea ? "Explore other Meru rental areas" : "Browse rentals by area in Meru"}
              </h2>
              <ul className="flex flex-wrap gap-3">
                {MERU_RENTAL_AREAS.filter((area) => area.slug !== activeArea?.slug).map((area) => (
                  <li key={area.slug}>
                    <Link href={area.path} className="inline-flex min-h-10 items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-blue-600 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:text-blue-300">
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
          </section>

          <section aria-labelledby="rental-faq-heading" className="max-w-4xl space-y-5">
            <h2 id="rental-faq-heading" className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">Rental questions</h2>
            <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white px-5 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 sm:px-7">
              {faq.map((item) => (
                <article key={item.question} className="py-5">
                  <h3 className="font-bold text-zinc-950 dark:text-white">{item.question}</h3>
                  <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-300">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
