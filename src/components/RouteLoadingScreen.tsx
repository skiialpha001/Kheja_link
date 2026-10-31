import { LogoMark } from "@/components/Logo";

export default function RouteLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      className="fixed inset-0 z-[200] grid place-items-center bg-white/70 px-4 backdrop-blur-sm dark:bg-zinc-950/75"
    >
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-zinc-200/80 bg-white/90 px-8 py-7 shadow-2xl shadow-black/10 dark:border-zinc-800 dark:bg-zinc-900/90">
        <span className="relative grid size-[5.25rem] place-items-center" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border-[3px] border-zinc-200 dark:border-zinc-700" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-blue-600 border-t-blue-600" />
          <LogoMark size={48} className="relative z-10" />
        </span>
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Loading <span className="font-black text-zinc-900 dark:text-white">KHEJA<span className="text-blue-600">_LINK</span></span>
        </span>
        <span className="sr-only">Loading the next page</span>
      </div>
    </div>
  );
}
