import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/supabase/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind a login should be crawled.
      disallow: [
        "/admin",
        "/dashboard",
        "/tenant",
        "/landlord",
        "/account",
        "/favorites",
        "/auth",
        "/login",
        "/register",
        "/signup",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
