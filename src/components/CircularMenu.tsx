"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  PlusCircle,
  Building2,
  User,
  LayoutGrid,
  Star,
  ShoppingBag,
} from "lucide-react";

const menuItems = [
  { id: "hunt", label: "Hunt a House", icon: Home },
  { id: "list", label: "List a House", icon: PlusCircle },
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "shops", label: "Shops", icon: ShoppingBag },
  { id: "rooms", label: "Single Rooms", icon: User },
  { id: "bedsitters", label: "Bedsitters", icon: LayoutGrid },
  { id: "premium", label: "Premium Units", icon: Star },
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
  const selectedId = value ?? internalId;
  const selectedLabel = menuItems.find((item) => item.id === selectedId)?.label;

  const handleSelect = (id: string) => {
    setInternalId(id);
    onSelect(id);
  };

  return (
    <div className="flex flex-col items-center justify-center py-5 sm:py-7">
      <div className="grid w-full grid-cols-3 justify-items-center gap-2 px-4 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {menuItems.map((item) => {
          const isSelected = selectedId === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-pressed={isSelected}
              aria-label={item.label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex min-h-20 w-full max-w-40 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-center transition-colors sm:min-h-24 ${
                isSelected
                  ? "border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-900/10"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-800 dark:hover:bg-zinc-900"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="w-full text-[10px] font-semibold leading-tight sm:text-[11px]">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p
        className="mt-5 min-h-5 px-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
        aria-live="polite"
      >
        Showing {selectedLabel}
      </p>
    </div>
  );
}
