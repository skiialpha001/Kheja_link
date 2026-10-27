"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LocationRow } from "@/lib/supabase/database.types";

export default function Hero({ locations = [] }: { locations?: LocationRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setIsSubmitting(true);

    // If the text is exactly an area we know, filter by that location — it is a
    // far better result than a fuzzy text match.
    const match = locations.find(
      (location) => location.name.toLowerCase() === value.toLowerCase(),
    );

    if (match) router.push(`/properties?location=${match.slug}`);
    else if (value) router.push(`/properties?q=${encodeURIComponent(value)}`);
    else router.push("/properties");
  };

  return (
    <section className="relative flex min-h-[min(72vh,44rem)] flex-col items-center justify-center overflow-hidden px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
      <div aria-hidden="true" className="home-hero-photo absolute inset-0 bg-cover bg-center" />
      <div aria-hidden="true" className="home-hero-scrim absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 18%, rgba(59, 130, 246, 0.38) 0%, transparent 45%), radial-gradient(ellipse at 86% 80%, rgba(16, 185, 129, 0.28) 0%, transparent 48%), radial-gradient(ellipse at 76% 12%, rgba(168, 85, 247, 0.22) 0%, transparent 40%)",
          }}
        />
      </div>
      <div className="relative z-10 w-full max-w-5xl space-y-8 rounded-[2rem] border border-white/35 bg-white/52 p-5 text-center shadow-2xl shadow-black/10 backdrop-blur-sm dark:border-white/10 dark:bg-[#171717]/68 sm:space-y-10 sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 sm:space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/85 px-4 py-2 text-sm font-semibold text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/85 dark:text-zinc-300"
          >
            <Home className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <span>Long-term rentals in Meru</span>
          </motion.div>
          <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-tighter text-zinc-900 dark:text-white sm:text-6xl md:text-8xl">
            Find your <br className="hidden sm:block" />
            <span className="relative inline-block text-blue-700 dark:text-blue-400">
              next home.
              <motion.span
                aria-hidden="true"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="absolute -bottom-1 left-0 h-1 rounded-full bg-blue-600 opacity-40 dark:bg-blue-400 sm:-bottom-2 sm:h-1.5"
              />
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg md:text-xl">
            Browse apartments, family homes, shops, and bedsitters across Meru.
            <span className="font-semibold text-zinc-900 dark:text-white">
              {" "}Clear listings, practical details, and direct contact.
            </span>
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="group relative mx-auto w-full max-w-3xl"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-[1.8rem] bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 opacity-25 blur transition-opacity duration-300 group-hover:opacity-40"
          />
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col items-stretch gap-2 rounded-2xl border border-zinc-200/90 bg-white/90 p-2 shadow-lg shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-700/90 dark:bg-zinc-900/90 sm:rounded-3xl md:flex-row md:items-center"
          >
            <div className="flex w-full min-w-0 flex-1 items-center gap-3 px-3 sm:px-4">
              <MapPin className="text-blue-500 w-5 h-5 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                list="kheja-hero-locations"
                placeholder="Where in Meru? (e.g. Makutano, Nkubu)"
                aria-label="Search by area, house type or keyword"
                className="h-12 w-full min-w-0 border-none bg-transparent font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-white"
              />
              <datalist id="kheja-hero-locations">
                {locations.map((location) => (
                  <option key={location.id} value={location.name} />
                ))}
              </datalist>
            </div>
            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-70 md:w-auto"
            >
              <Search className="w-5 h-5" />
              <span>{isSubmitting ? "Searching…" : "Explore Now"}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
