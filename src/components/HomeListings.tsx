"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CircularMenu from "@/components/CircularMenu";
import PropertyCard from "@/components/PropertyCard";
import type { PropertyListItem } from "@/lib/types";

/**
 * The homepage discovery section.
 *
 * The server hands over one page of published listings; switching category
 * filters them in place, which keeps the original instant, animated feel while
 * the data itself is entirely real. "View All" hands off to /properties, where
 * the full filtered query runs against the database.
 */

const CATEGORY_LABELS: Record<string, string> = {
  hunt: "Featured Homes",
  apartments: "Apartments",
  bedsitters: "Bedsitters",
  rooms: "Single Rooms",
  shops: "Shops",
  premium: "Premium Units",
};

const CATEGORY_TYPE: Record<string, string | undefined> = {
  apartments: "apartment",
  bedsitters: "bedsitter",
  rooms: "single_room",
  shops: "shop",
};

const CATEGORY_HREF: Record<string, string> = {
  hunt: "/properties",
  apartments: "/properties?type=apartment",
  bedsitters: "/properties?type=bedsitter",
  rooms: "/properties?type=single_room",
  shops: "/properties?type=shop",
  premium: "/properties?premium=1",
};

export default function HomeListings({ properties }: { properties: PropertyListItem[] }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("hunt");

  const visible = useMemo(() => {
    if (activeCategory === "hunt") return properties.slice(0, 6);
    if (activeCategory === "premium") return properties.filter((p) => p.is_premium).slice(0, 6);
    const typeSlug = CATEGORY_TYPE[activeCategory];
    if (!typeSlug) return [];
    return properties.filter((p) => p.property_type?.slug === typeSlug).slice(0, 6);
  }, [activeCategory, properties]);

  const handleSelect = (id: string) => {
    // "List a House" is a destination, not a filter — it is how a landlord
    // starts a listing, which is what the original empty state hinted at.
    if (id === "list") {
      router.push("/dashboard/properties/new");
      return;
    }
    setActiveCategory(id);
  };

  const heading = CATEGORY_LABELS[activeCategory] ?? "Featured Homes";
  const viewAllHref = CATEGORY_HREF[activeCategory] ?? "/properties";

  return (
    <>
      {/* Interactive Circular Menu Section */}
      <section className="relative z-20 mt-0">
        <div className="max-w-7xl mx-auto">
          <CircularMenu value={activeCategory} onSelect={handleSelect} />
        </div>
      </section>

      {/* Dynamic Content Section */}
      <section id="listings" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            layout
            className="mb-10 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between"
          >
            <div className="space-y-3 sm:space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px]"
              >
                <Home className="h-4 w-4" />
                <span>Find a place to call home</span>
              </motion.div>
              <h2 className="text-4xl font-black capitalize tracking-tighter text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
                {heading}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={viewAllHref}
                className="flex items-center gap-2 px-6 h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-zinc-600 dark:text-zinc-400 hover:border-blue-500 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </Link>
              <Link
                href={viewAllHref}
                className="flex items-center gap-2 text-zinc-900 dark:text-white font-black hover:text-blue-600 transition-colors group"
              >
                <span>View All</span>
                <span className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
            >
              {visible.length > 0 ? (
                visible.map((property) => <PropertyCard key={property.id} property={property} />)
              ) : (
                <div className="col-span-full space-y-5 py-20 text-center sm:py-32">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-900">
                    <Home className="h-9 w-9 text-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                      {properties.length === 0 ? "No published listings available" : "Almost there!"}
                    </h3>
                    <p className="text-zinc-500 font-medium max-w-md mx-auto">
                      {properties.length === 0
                        ? "There are no published homes to show right now. Please check back soon."
                        : `We're verifying new ${heading.toLowerCase()} in Meru. Check back shortly!`}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/properties/new"
                    className="inline-flex items-center gap-2 px-8 h-14 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    List your property
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
