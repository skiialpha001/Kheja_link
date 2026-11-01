import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import AIChatAssistant from "@/components/AIChatAssistant";
import PrivacyAwareAnalytics from "@/components/PrivacyAwareAnalytics";
import ThemeProvider from "@/components/ThemeProvider";
import { getSiteUrl } from "@/lib/supabase/env";
import StructuredData from "@/components/StructuredData";
import { SOCIAL } from "@/lib/social";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const siteUrl = getSiteUrl();

/** Google AdSense publisher ID (also in public/ads.txt and public/app-ads.txt). */
const ADSENSE_CLIENT = "ca-pub-3771359841277271";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KhejaLink | Houses, Bedsitters & Apartments for Rent in Meru, Kenya",
    template: "%s | KhejaLink",
  },
  description:
    "Browse current houses, bedsitters, single rooms, apartments and shops for rent in Meru, Kenya. Search Kaaga, Makutano, Gitoro, Nchiru, Nkubu and Meru Town, compare listed rent and contact listers.",
  applicationName: "Kheja_Link",
  openGraph: {
    type: "website",
    siteName: "Kheja_Link",
    locale: "en_KE",
    title: "KhejaLink | Houses, Bedsitters & Apartments for Rent in Meru, Kenya",
    description:
      "Browse current long-term rentals in Meru County, compare listing details and contact listers directly.",
    url: siteUrl,
    images: [{ url: "/home-hero-light.webp", alt: "A home available to rent in Meru, Kenya" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KhejaLink | Rentals in Meru, Kenya",
    description: "Browse houses, bedsitters and apartments for rent across Meru County.",
    images: ["/home-hero-light.webp"],
  },
  robots: { index: true, follow: true },
  // AdSense site-ownership verification (the meta-tag method).
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kheja_Link",
    url: siteUrl,
    logo: new URL("/khejalink-logo.jpeg", siteUrl).toString(),
    description:
      "A rental property discovery platform for long-term homes and commercial spaces in Meru County, Kenya.",
    areaServed: [
      "Meru Town",
      "Kaaga",
      "Kithoka",
      "Makutano",
      "Gitoro",
      "Nchiru",
      "Nkubu",
      "Kaithe",
    ].map((name) => ({ "@type": "Place", name })),
    sameAs: [SOCIAL.tiktok.url],
  };

  return (
    <html lang="en-KE" className={geist.variable} suppressHydrationWarning>
      <head>
        <StructuredData data={organizationSchema} />
        {/* Google AdSense: verifies the site and serves ads. Exactly Google's
            snippet — a plain async script in the head of every page. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <AIChatAssistant />
          <Toaster position="bottom-center" richColors closeButton />
          <PrivacyAwareAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
