import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/supabase/env";
import { getProperties } from "@/lib/queries/properties";
import { withFavoriteState } from "@/lib/queries/favorites";
import { getCurrentProfile } from "@/lib/supabase/server";
import { MERU_RENTAL_HUB } from "@/lib/seo/meru-rental-areas";
import { canonicalAlternates } from "@/lib/seo/metadata";
import RentalSeoLanding from "@/components/RentalSeoLanding";
import StructuredData from "@/components/StructuredData";

export const dynamic = "force-dynamic";

const faq = [
  {
    question: "What types of rentals can I find in Meru?",
    answer:
      "Browse the current published long-term listings, including houses, apartments, bedsitters, single rooms and shops. The available types depend on what listers have published.",
  },
  {
    question: "How can I compare rent across Meru?",
    answer:
      "Each property card shows its advertised rent and period. Use the rental search filters to narrow listings by area, property type, bedrooms and price.",
  },
  {
    question: "How do I confirm a listing before paying?",
    answer:
      "Contact the lister to confirm current availability, exact directions, deposit and any additional charges. Arrange a viewing and verify the payment recipient before sending money.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const result = await getProperties({ perPage: 1 }).catch(() => null);
  return {
    title: MERU_RENTAL_HUB.title,
    description: MERU_RENTAL_HUB.description,
    alternates: canonicalAlternates(MERU_RENTAL_HUB.path),
    robots: result?.total ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "en_KE",
      title: MERU_RENTAL_HUB.title,
      description: MERU_RENTAL_HUB.description,
      url: MERU_RENTAL_HUB.path,
      images: ["/home-hero-light.webp"],
    },
  };
}

export default async function MeruRentalHubPage() {
  const [result, profile] = await Promise.all([
    getProperties({ perPage: 24 }).catch(() => ({
      items: [], total: 0, page: 1, perPage: 24, pageCount: 0,
    })),
    getCurrentProfile().catch(() => null),
  ]);
  const properties = await withFavoriteState(result.items).catch(() => result.items);
  const siteUrl = getSiteUrl();

  const itemList = properties.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Current long-term rental listings in Meru County",
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
    mainEntity: faq.map((item) => ({
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
      { "@type": "ListItem", position: 2, name: "Meru rentals", item: `${siteUrl}${MERU_RENTAL_HUB.path}` },
    ],
  };

  return <>
    {itemList && <StructuredData data={itemList} />}
    <StructuredData data={faqSchema} />
    <StructuredData data={breadcrumbs} />
    <RentalSeoLanding
      title={MERU_RENTAL_HUB.title}
      intro="Compare currently published long-term rentals across Meru County. Browse listed rent, property type, bedrooms and amenities, then confirm the details directly with the lister."
      localNote="Use the area labels and directions in each listing to choose a location that works for you. Advertised rents and amenities are specific to each property; KhejaLink does not estimate market averages or guarantee availability."
      faq={faq}
      profile={profile}
      properties={properties}
      total={result.total}
    />
  </>;
}
