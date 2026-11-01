import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RentalSeoLanding from "@/components/RentalSeoLanding";
import StructuredData from "@/components/StructuredData";
import { getProperties, getPropertiesForLocations } from "@/lib/queries/properties";
import { withFavoriteState } from "@/lib/queries/favorites";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { getMeruRentalArea } from "@/lib/seo/meru-rental-areas";
import { canonicalAlternates } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getAreaInventory(slug: string) {
  const area = getMeruRentalArea(slug);
  if (!area) return null;
  return getPropertiesForLocations(area.locationSlugs, 1).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const area = getMeruRentalArea(slug);
  if (!area) return { title: "Rental area not found", robots: { index: false, follow: true } };

  const result = await getAreaInventory(slug);
  return {
    title: area.heading,
    description: area.description,
    alternates: canonicalAlternates(area.path),
    robots: result?.total ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "en_KE",
      title: area.heading,
      description: area.description,
      url: area.path,
      images: ["/home-hero-light.webp"],
    },
  };
}

export default async function MeruRentalAreaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const area = getMeruRentalArea(slug);
  if (!area) notFound();

  let listingLoadFailed = false;
  let result: Awaited<ReturnType<typeof getPropertiesForLocations>>;
  try {
    result = await getPropertiesForLocations(area.locationSlugs, 24);
  } catch {
    listingLoadFailed = true;
    result = { items: [], total: 0, page: 1, perPage: 24, pageCount: 0 };
  }

  const [profile, fallback] = await Promise.all([
    getCurrentProfile().catch(() => null),
    result.total === 0 && !listingLoadFailed
      ? getProperties({ perPage: 6 }).catch(() => ({ items: [] as typeof result.items }))
      : Promise.resolve({ items: [] as typeof result.items }),
  ]);
  const [properties, fallbackProperties] = await Promise.all([
    withFavoriteState(result.items).catch(() => result.items),
    withFavoriteState(fallback.items).catch(() => fallback.items),
  ]);
  const siteUrl = getSiteUrl();

  const itemList = properties.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Current rentals in ${area.name}, Meru`,
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/properties/${property.slug}`,
      name: property.title,
    })),
  } : null;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: area.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Meru rentals", item: `${siteUrl}/houses-for-rent-meru` },
      { "@type": "ListItem", position: 3, name: area.name, item: `${siteUrl}${area.path}` },
    ],
  };

  return <>
    {itemList && <StructuredData data={itemList} />}
    <StructuredData data={faqSchema} />
    <StructuredData data={breadcrumbs} />
    <RentalSeoLanding
      title={area.heading}
      intro={area.description}
      localNote={area.localNote}
      faq={area.faqs}
      activeArea={area}
      profile={profile}
      properties={properties}
      total={result.total}
      fallbackProperties={fallbackProperties}
      listingLoadFailed={listingLoadFailed}
    />
  </>;
}
