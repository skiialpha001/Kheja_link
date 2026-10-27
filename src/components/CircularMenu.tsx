"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  PlusCircle,
  Building2,
  User,
  LayoutGrid,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

const menuItems = [
  { id: "hunt", label: "Hunt a House", icon: Home, activeColor: "#2563eb" },
  { id: "list", label: "List a House", icon: PlusCircle, activeColor: "#059669" },
  { id: "apartments", label: "Apartments", icon: Building2, activeColor: "#9333ea" },
  { id: "shops", label: "Shops", icon: ShoppingBag, activeColor: "#0891b2" },
  { id: "rooms", label: "Single Rooms", icon: User, activeColor: "#ea580c" },
  { id: "bedsitters", label: "Bedsitters", icon: LayoutGrid, activeColor: "#db2777" },
  { id: "premium", label: "Premium Units", icon: Sparkles, activeColor: "#d97706" },
];

export default function CircularMenu({
  value,
  onSelect,
}: {
  /** Controlled selection, so the page and the menu never disagree. */
  value?: string;
  onSelect: (id: string) => void;
}) {
  const [internalId, setInternalId] = useState("hunt");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectedId = value ?? internalId;
  const selectedItem = menuItems.find((item) => item.id === selectedId) ?? menuItems[0];

  useEffect(() => {
    document.documentElement.style.setProperty("--category-accent", selectedItem.activeColor);
  }, [selectedItem.activeColor]);

  const handleSelect = (id: string) => {
    setInternalId(id);
    onSelect(id);
  };

  return (
    <div className="relative flex flex-col items-center justify-center overflow-visible pb-6 pt-4 md:pb-10 md:pt-4">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={selectedId}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 0.16, scale: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-[26rem] w-screen -translate-x-1/2 blur-[105px]"
          style={{ backgroundColor: selectedItem.activeColor }}
        />
      </AnimatePresence>

      <div className="relative z-10 flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-8 px-4 sm:gap-x-6 md:gap-x-8">
        {menuItems.map((item) => {
          const isSelected = selectedId === item.id;
          const isHovered = hoveredId === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-pressed={isSelected}
              aria-label={item.label}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex flex-col items-center rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
            >
              <div className="relative flex items-center justify-center">
                <motion.span
                  animate={{
                    scale: isSelected ? 1.15 : isHovered ? 1.05 : 1,
                    backgroundColor: isSelected ? item.activeColor : "rgba(255, 255, 255, 0.94)",
                    boxShadow: isSelected
                      ? `0 20px 40px -10px ${item.activeColor}66`
                      : "0 10px 25px -5px rgba(0,0,0,0.06)",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-md transition-colors duration-500 md:h-24 md:w-24 ${
                    isSelected
                      ? "border-transparent"
                      : "border-zinc-200/70 dark:border-zinc-800/70"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 transition-colors duration-300 md:h-9 md:w-9 ${
                      isSelected
                        ? "text-white"
                        : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white"
                    }`}
                    aria-hidden="true"
                  />

                  {isSelected && (
                    <motion.span
                      layoutId="active-category-ring"
                      aria-hidden="true"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="pointer-events-none absolute -inset-2 rounded-full border-2 border-white/25"
                    />
                  )}
                </motion.span>

                {isSelected && (
                  <motion.span
                    layoutId="active-category-dot"
                    aria-hidden="true"
                    className="absolute -bottom-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.activeColor }}
                  />
                )}
              </div>

              <motion.span
                animate={{
                  opacity: isSelected || isHovered ? 1 : 0.62,
                  y: isSelected ? 4 : 0,
                  scale: isSelected ? 1.06 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`mt-4 whitespace-nowrap text-[10px] font-black uppercase tracking-tight transition-colors duration-500 md:text-xs ${
                  isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-500"
                }`}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        key={`${selectedId}-caption`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 mt-10 flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/50 px-6 py-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50"
        aria-live="polite"
      >
        <span
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: selectedItem.activeColor }}
          aria-hidden="true"
        />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
          Showing results for{" "}
          <span className="text-zinc-900 dark:text-white">{selectedItem.label}</span>
        </span>
      </motion.div>
    </div>
  );
}
