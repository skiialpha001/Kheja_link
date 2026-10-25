"use client";

import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function InteractionLoadingIndicator() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearIndicator = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const showIndicator = useCallback((duration: number) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setIsVisible(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      timeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    clearIndicator();
  }, [pathname, clearIndicator]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (button) {
        if (button.disabled || button.getAttribute("aria-busy") === "true") return;
        if (button.form && button.type === "submit") return;

        // Let a component's own pending state take precedence when it already
        // disables the button or renders its own spinner.
        window.setTimeout(() => {
          if (
            !button.isConnected ||
            button.disabled ||
            button.getAttribute("aria-busy") === "true" ||
            button.querySelector(".animate-spin")
          ) {
            return;
          }
          showIndicator(850);
        }, 0);
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      showIndicator(destination.pathname === current.pathname ? 1400 : 10000);
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const submitter = event.submitter;
      window.setTimeout(() => {
        if (
          submitter instanceof HTMLButtonElement &&
          (submitter.disabled || submitter.getAttribute("aria-busy") === "true" || submitter.querySelector(".animate-spin"))
        ) {
          return;
        }
        showIndicator(2400);
      }, 0);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [showIndicator]);

  useEffect(() => clearIndicator, [clearIndicator]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!isVisible}
      className={`pointer-events-none fixed bottom-5 left-5 z-[100] inline-flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-xl shadow-black/10 backdrop-blur-sm transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <LoaderCircle className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}
