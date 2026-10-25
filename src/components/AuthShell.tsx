import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Shared frame for sign-in and sign-up screens.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <Logo size={44} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>

        {/* The full lockup, where there is room to show it properly. The
            navbar and favicon use the mark alone, which stays legible small. */}
        <div className="relative w-full aspect-[5/2] rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <Image
            src="/khejalink-lockup.jpeg"
            alt="Kheja_Link"
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.98]">
            {title}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{subtitle}</p>
        </div>

        <div className="p-5 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:rounded-[2rem] shadow-sm">
          {children}
        </div>

        <div className="text-center text-sm font-bold text-zinc-500">{footer}</div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</span>
      {children}
      {error && <span className="block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

export const authInputClass =
  "w-full h-14 px-5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-medium text-zinc-900 dark:text-white outline-none focus:border-blue-500 transition-colors";
