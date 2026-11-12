"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, Play, Video } from "lucide-react";
import type { PropertyVideoRow } from "@/lib/supabase/database.types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type GalleryImage = {
  id: string;
  public_url: string;
  alt_text: string | null;
};

type GalleryVideo = Pick<
  PropertyVideoRow,
  "id" | "public_url" | "thumbnail_url" | "caption" | "duration_seconds" | "sort_order"
>;

/**
 * The original card only ever rendered images[0], but the data model always
 * anticipated a set — this is the gallery that finally uses it.
 */
export default function PropertyGallery({
  images,
  videos,
  title,
  propertyType,
}: {
  images: GalleryImage[];
  videos: GalleryVideo[];
  title: string;
  propertyType?: string;
}) {
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const media = [
    ...images.map((image) => ({ kind: "image" as const, ...image })),
    ...videos.map((video) => ({ kind: "video" as const, ...video })),
  ];

  if (media.length === 0) {
    return (
      <div className="relative w-full aspect-[16/10] rounded-[3rem] bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-800">
        <ImageIcon className="w-12 h-12 text-zinc-300" />
        <p className="text-sm font-bold text-zinc-400">No photos yet</p>
      </div>
    );
  }

  const go = (delta: number) =>
    setIndex((current) => (current % media.length + delta + media.length) % media.length);

  const activeIndex = Math.min(index, media.length - 1);
  const active = media[activeIndex];

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[16/10] rounded-[3rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 group">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            role={active.kind === "image" ? "button" : undefined}
            tabIndex={active.kind === "image" ? 0 : undefined}
            aria-label={active.kind === "image" ? `Open ${title} photo in full screen` : undefined}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              if (active.kind === "image") {
                setViewerOpen(true);
                return;
              }

              // Leave the native controls at the bottom of the video usable.
              const bounds = event.currentTarget.getBoundingClientRect();
              if (bounds.bottom - event.clientY > 56) setViewerOpen(true);
            }}
            onKeyDown={(event) => {
              if (
                active.kind === "image" &&
                !((event.target as HTMLElement).closest("button")) &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                setViewerOpen(true);
              }
            }}
          >
            {active.kind === "image" ? (
              <Image
                src={active.public_url}
                alt={`${title} - ${propertyType ?? "rental property"} for rent in Meru, Kenya${active.alt_text?.trim() ? `: ${active.alt_text.trim()}` : ""}`}
                fill
                priority={activeIndex === 0}
                loading={activeIndex === 0 ? "eager" : "lazy"}
                fetchPriority={activeIndex === 0 ? "high" : undefined}
                decoding="async"
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <video
                key={active.id}
                src={active.public_url}
                poster={active.thumbnail_url ?? images[0]?.public_url}
                aria-label={active.caption || `${title} property walkthrough video`}
                controls
                muted
                playsInline
                preload="metadata"
                onVolumeChange={(event) => {
                  if (!event.currentTarget.muted) event.currentTarget.muted = true;
                }}
                className="h-full w-full bg-black object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="View photo or video full screen"
          className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Maximize2 className="h-5 w-5" aria-hidden="true" />
        </button>

        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 right-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-white text-xs font-black tracking-widest">
              {active.kind === "video" && <Video className="mr-2 inline-block w-3.5 h-3.5" aria-hidden="true" />}
              {activeIndex + 1} / {media.length}
            </div>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {media.map((item, i) => {
            const thumbnail = item.kind === "video"
              ? item.thumbnail_url ?? images[0]?.public_url
              : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={item.kind === "video" ? `Show video ${i + 1}` : `Show photo ${i + 1}`}
                aria-current={i === activeIndex}
                className={`relative w-28 h-20 shrink-0 rounded-2xl overflow-hidden transition-all ${
                  i === activeIndex
                    ? "ring-2 ring-blue-600 ring-offset-2 ring-offset-[#fafafa] dark:ring-offset-black"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {item.kind === "image" ? (
                  <Image
                    src={item.public_url}
                    alt=""
                    fill
                    sizes="112px"
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                  />
                ) : (
                  <>
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt=""
                        fill
                        sizes="112px"
                        loading="lazy"
                        decoding="async"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-zinc-900" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                      <Play className="w-6 h-6 fill-current" aria-hidden="true" />
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent
          showCloseButton
          className="!fixed !inset-0 !left-0 !top-0 !flex !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !items-center !justify-center !rounded-none !border-0 !p-0 bg-black text-white"
        >
          <DialogTitle className="sr-only">
            {title} {active.kind === "image" ? "photo" : "video"}
          </DialogTitle>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {active.kind === "image" ? (
              <Image
                src={active.public_url}
                alt={`${title} - ${propertyType ?? "rental property"} for rent in Meru, Kenya`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            ) : (
              <video
                src={active.public_url}
                poster={active.thumbnail_url ?? images[0]?.public_url}
                aria-label={active.caption || `${title} property walkthrough video`}
                controls
                muted
                playsInline
                preload="auto"
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
