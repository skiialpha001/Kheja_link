import { getSiteUrl } from "@/lib/supabase/env";

/** Canonical and language links for the single public English-Kenya edition. */
export function canonicalAlternates(path: string) {
  const canonical = new URL(path, getSiteUrl()).toString();
  return {
    canonical,
    languages: {
      "en-KE": canonical,
      "x-default": canonical,
    },
  };
}
