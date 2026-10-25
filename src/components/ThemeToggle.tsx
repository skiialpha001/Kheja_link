"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted ? "Theme settings" : `Switch to ${isDark ? "light" : "dark"} theme`;
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-wait dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
