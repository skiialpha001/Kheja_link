import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { getMeruAreaPathForLocation, MERU_RENTAL_AREAS, MERU_RENTAL_HUB } from "@/lib/seo/meru-rental-areas";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/properties`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/movemate-movers`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/help`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/delete-account`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("properties")
      .select("slug, is_demo, updated_at, location:locations ( slug )")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);

    const publicListings = ((data ?? []) as unknown as {
      slug: string;
      is_demo: boolean;
      updated_at: string | null;
      location: { slug: string } | null;
    }[]).filter((property) => !property.is_demo);
    const areaSlugs = new Set(
      publicListings
        .map((property) => property.location?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    );
    const activeAreaPaths = MERU_RENTAL_AREAS
      .filter((area) => area.locationSlugs.some((slug) => areaSlugs.has(slug)))
      .map((area) => ({
        url: `${siteUrl}${area.path}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    const mappedAreaSlugs = new Set(MERU_RENTAL_AREAS.flatMap((area) => area.locationSlugs));

    return [
      ...staticRoutes,
      ...(publicListings.length > 0
        ? [{ url: `${siteUrl}${MERU_RENTAL_HUB.path}`, changeFrequency: "daily" as const, priority: 0.9 }]
        : []),
      ...activeAreaPaths,
      { url: `${siteUrl}/areas`, changeFrequency: "weekly", priority: 0.7 },
      ...[...areaSlugs].filter((slug) => !mappedAreaSlugs.has(slug)).map((slug) => ({
        url: `${siteUrl}/areas/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.75,
      })),
      ...publicListings.map((property) => ({
        url: `${siteUrl}/properties/${property.slug}`,
        lastModified: property.updated_at ? new Date(property.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // A sitemap is never worth failing a build over.
    return staticRoutes;
  }
}
