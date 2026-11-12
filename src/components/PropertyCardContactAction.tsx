"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RAPH_CONTACT, toTelephoneHref } from "@/lib/contact";

export default function PropertyCardContactAction({
  propertyHref,
  isDemo,
  title,
}: {
  propertyHref: string;
  isDemo: boolean;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const raphTel = toTelephoneHref(RAPH_CONTACT.telephone);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Contact options for ${title}`}
        aria-haspopup="dialog"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95"
      >
        <Phone className="h-6 w-6" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-xl font-black text-zinc-950 dark:text-white">
              Choose how to contact us
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {isDemo
                ? `Call Raph if you have a question about “${title}”.`
                : `For “${title}”, call Raph for help or open the listing to unlock the landlord’s direct details.`}
            </DialogDescription>
          </DialogHeader>

          {raphTel && (
            <a
              href={raphTel}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call Raph · {RAPH_CONTACT.displayTelephone}
            </a>
          )}

          {isDemo ? (
            <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              This is a demo listing and has no real landlord contact to unlock. Call Raph if you have a question about it.
            </p>
          ) : (
            <Link
              href={`${propertyHref}#contact`}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Pay to unlock landlord details
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
