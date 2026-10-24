"use client";

import { motion } from "framer-motion";
import { Heart, MapPin, BedDouble, Bath, Square, Phone, ArrowUpRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { availabilityLabel, formatLocation, formatRent, formatSize, normalisePhone } from "@/lib/format";
import type { PropertyListItem } from "@/lib/types";

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='800' height='600' fill='%23e4e4e7'/%3E%3C/svg%3E";

export default function PropertyCard({ property }: { property: PropertyListItem }) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(Boolean(property.is_favorited));
  const [isPending, startTransition] = useTransition();

  const cover = property.images?.[0];
  const size = formatSize(property.size_sqft);
  const phone = normalisePhone(property.contact_phone);
  const href = `/properties/${property.slug}`;
  const availability = availabilityLabel(property.availability, property.available_from);

  const handleToggleFavorite = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Optimistic — reverted below if the server disagrees.
    const next = !isLiked;
    setIsLiked(next);

    startTransition(async () => {
      const result = await toggleFavoriteAction(property.id);
      if (!result.ok) {
        setIsLiked(!next);
        toast.error(result.error, {
          action: { label: "Sign in", onClick: () => router.push("/login") },
        });
        return;
      }
      setIsLiked(result.data.favorited);
      toast.success(result.message ?? "Saved.");
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Image Container */}
      <div className="relative h-64 w-full overflow-hidden bg-zinc-100 sm:h-72 lg:h-80 dark:bg-zinc-800">
        <Link href={href} aria-label={property.title} className="absolute inset-0 z-10" />
        <Image
          src={cover?.public_url ?? FALLBACK_IMAGE}
          alt={cover?.alt_text ?? property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {/* Badges */}
        <div className="absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="max-w-full truncate rounded-xl border border-white/20 bg-zinc-950/75 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
              {property.property_type?.name ?? "Rental"}
            </span>
            {property.is_premium && (
              <span className="rounded-xl bg-amber-700/90 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
                Premium
              </span>
            )}
            {availability && (
              <span
                className={`rounded-xl px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px] ${
                  availability.tone === "purple"
                    ? "bg-purple-800/90"
                    : availability.tone === "amber"
                      ? "bg-orange-800/90"
                      : "bg-zinc-700/90"
                }`}
              >
                {availability.label}
              </span>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isPending}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Remove from saved homes" : "Save this home"}
            className="group/heart flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-zinc-950/75 transition-colors hover:bg-zinc-950 disabled:opacity-70 sm:h-11 sm:w-11"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Heart
                className={`w-5 h-5 transition-all duration-300 ${
                  isLiked ? "fill-red-500 text-red-500 scale-125" : "text-white group-hover/heart:scale-110"
                }`}
              />
            )}
          </button>
        </div>

        {/* Price Tag */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-xl bg-zinc-950/80 px-3 py-2 sm:bottom-5 sm:left-5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-col">
            <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 sm:text-xs">
              {property.price_period === "year" ? "Annual Rent" : "Monthly Rent"}
            </span>
            <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {formatRent(property.price_amount, property.price_period, property.price_currency).replace(
                / \/ (month|year)$/,
                "",
              )}
            </div>
          </div>
        </div>

        {/* Floating Action */}
        <div className="pointer-events-none absolute bottom-5 right-5 z-20 hidden translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5 sm:p-7">
        <div className="space-y-2">
          <h3 className="text-xl font-bold leading-snug text-zinc-900 transition-colors group-hover:text-blue-700 sm:text-2xl dark:text-white">
            <Link href={href}>{property.title}</Link>
          </h3>
          <div className="flex items-start gap-1.5 text-zinc-500 dark:text-zinc-400">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm font-bold tracking-tight">{formatLocation(property.location)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-3 border-y border-zinc-100 py-4 dark:border-zinc-800 sm:justify-between">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <BedDouble className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-black text-zinc-900 dark:text-white">
                {property.bedrooms}
              </span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                <Bath className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-black text-zinc-900 dark:text-white">
                {property.bathrooms}
              </span>
            </div>
          )}
          {size && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Square className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-black text-zinc-900 dark:text-white">{size}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={href}
            className="flex-1 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center"
          >
            View Details
          </Link>
          {phone ? (
            <a
              href={`tel:${phone}`}
              aria-label={`Call about ${property.title}`}
              className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:rotate-12 transition-all duration-300 shadow-lg shadow-blue-600/20 shrink-0"
            >
              <Phone className="w-6 h-6" />
            </a>
          ) : (
            <Link
              href={`${href}#contact`}
              aria-label={`Contact the landlord about ${property.title}`}
              className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 hover:rotate-12 transition-all duration-300 shadow-lg shadow-blue-600/20 shrink-0"
            >
              <Phone className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
