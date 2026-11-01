import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { getLocations } from "@/lib/queries/lookups";
import { getProperties } from "@/lib/queries/properties";
import { withFavoriteState } from "@/lib/queries/favorites";
import { getCurrentProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getArea(slug: string) {
  const locations = await getLocations().catch(() => []);
  return locations.find((location) => location.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const area = await getArea(slug);

  if (!area) {
    return { title: "Rental area not found", robots: { index: false, follow: true } };
  }

  const result = await getProperties({ location: slug, perPage: 1 }).catch(() => null);
  const hasListings = Boolean(result?.total);
  const subtitle = [area.area, area.county].filter(Boolean).join(", ");
  const title = `Houses for Rent in ${area.name}, Meru`;

  return {
    title,
    description: hasListings
      ? `Browse ${result?.total} current long-term rental${result?.total === 1 ? "" : "s"} in ${area.name}${subtitle ? `, ${subtitle}` : ""}. Compare rent, property type, bedrooms and amenities on Kheja_Link.`
      : `Check current long-term rental availability in ${area.name}, Meru County, on Kheja_Link.`,
    alternates: { canonical: `/areas/${area.slug}` },
    robots: hasListings ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      title,
      description: `Explore current long-term rentals in ${area.name}, Meru County.`,
    },
  };
}

export default async function RentalAreaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [area, profile] = await Promise.all([
    getArea(slug),
    getCurrentProfile().catch(() => null),
  ]);

  if (!area) notFound();

  let listingLoadFailed = false;
  let result: Awaited<ReturnType<typeof getProperties>>;
  try {
    result = await getProperties({ location: slug, perPage: 24 });
  } catch {
    listingLoadFailed = true;
    result = { items: [], total: 0, page: 1, perPage: 24, pageCount: 1 };
  }
  const properties = await withFavoriteState(result.items).catch(() => result.items);
  const subarea = [area.area, area.county].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar profile={profile} />
      <main className="px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-7xl space-y-10">
          <Link href="/areas" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-400">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            All rental areas
          </Link>

          <header className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              <span>{subarea || "Meru County, Kenya"}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              Houses for rent in {area.name}
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              Browse current long-term rentals in {area.name}{subarea ? `, ${subarea}` : ", Meru County"}. Compare the listed rent, home type, bedrooms and amenities. Confirm availability and viewing details with the lister.
            </p>
          </header>

          <section aria-labelledby="area-listings-title" className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="area-listings-title" className="text-2xl font-bold text-zinc-950 dark:text-white">
                  Current rentals in {area.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Showing {Math.min(result.total, properties.length)} of {result.total} published listing{result.total === 1 ? "" : "s"}
                </p>
              </div>
              <Link
                href={`/properties?location=${encodeURIComponent(area.slug)}`}
                className="text-sm font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-400"
              >
                View all rentals and filters
              </Link>
            </div>

            {listingLoadFailed ? (
              <p role="status" className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                We could not load rentals right now. Please refresh in a moment.
              </p>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="font-semibold text-zinc-950 dark:text-white">No published rentals here right now.</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Availability changes as listers add or rent homes. Browse nearby areas or search all Meru listings.
                </p>
                <Link href="/areas" className="mt-4 inline-flex font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-400">
                  Browse other areas
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
