"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const PRIVATE_ROUTE_PREFIXES = [
  "/account",
  "/admin",
  "/auth",
  "/checkout",
  "/dashboard",
  "/delete-account",
  "/favorites",
  "/login",
  "/messages",
  "/payment",
  "/payments",
  "/signup",
];

function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, window.location.origin);
    const pathname = url.pathname;
    if (PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return null;
    }

    // Search parameters can contain auth codes, payment references, and other
    // user data. Page views need only the public path.
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    // Unknown URL formats are not sent to a third-party analytics endpoint.
    return null;
  }
}

export default function PrivacyAwareAnalytics() {
  return <Analytics beforeSend={sanitizeAnalyticsEvent} />;
}
