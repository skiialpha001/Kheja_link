import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TikTokIcon } from "@/components/SocialIcons";
import { SOCIAL } from "@/lib/social";
import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  House,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import MoveMateQuoteForm from "@/components/MoveMateQuoteForm";

const phoneDisplay = "0710 655 709";
const phoneHref = "tel:+254710655709";
const whatsappHref =
  "https://wa.me/254710655709?text=Hello%20MoveMate%20Movers.%20I%20would%20like%20to%20ask%20about%20a%20move%20in%20Meru.";

export const metadata: Metadata = {
  title: "MoveMate Movers in Meru | Request a Moving Quote",
  description:
    "Contact MoveMate Movers about house, bedsitter, student-room and office moves in Meru. Request a quote based on your items, route, number of movers and floor access at pickup and delivery.",
  alternates: { canonical: "/movemate-movers" },
  openGraph: {
    type: "website",
    title: "MoveMate Movers in Meru | Request a Moving Quote",
    description:
      "Request a moving quote in Meru. Share your items, route, pickup floor and destination floor directly with MoveMate Movers.",
    url: "/movemate-movers",
  },
};

const services = [
  {
    icon: House,
    title: "House and apartment moves",
    description:
      "For household moves, share the main items and the floor at both the place you are leaving and the place you are moving into.",
  },
  {
    icon: Box,
    title: "Bedsitter and student-room moves",
    description:
      "Send a short list of your belongings and the pickup and delivery areas to request a quote for a smaller move.",
  },
  {
    icon: Building2,
    title: "Shop and office moves",
    description:
      "Describe the items, approximate quantity, route and building access so MoveMate can confirm whether the move can be handled.",
  },
  {
    icon: Package,
    title: "Single-item enquiries",
    description:
      "For a large item or a smaller pickup, contact MoveMate to check availability and the price for your route.",
  },
];

const quoteSteps = [
  "List the items and approximate quantity.",
  "Share the pickup and delivery areas.",
  "Give the floor level at both locations and note stairs or lift access.",
  "Ask MoveMate to confirm current availability and the final price directly before proceeding.",
];

export default function MoveMateMoversPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/movemate-movers" className="inline-flex items-center gap-3" aria-label="MoveMate Movers home">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#ff5500] bg-[#ff5500] shadow-sm">
              <Image
                src="/movemate-movers-logo.png"
                alt="MoveMate Movers logo"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />
            </span>
            <span className="sr-only">MoveMate Movers</span>
          </Link>

          <nav aria-label="Page navigation" className="hidden items-center gap-6 text-sm font-semibold text-zinc-700 md:flex dark:text-zinc-300">
            <a href="#services" className="hover:text-emerald-800 dark:hover:text-emerald-400">Moving help</a>
            <a href="#quote-factors" className="hover:text-emerald-800 dark:hover:text-emerald-400">Quote factors</a>
            <a href="#team" className="hover:text-emerald-800 dark:hover:text-emerald-400">MoveMate in action</a>
            <a href="#quote" className="hover:text-emerald-800 dark:hover:text-emerald-400">Request a quote</a>
          </nav>

          <a
            href={phoneHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Call</span>
            {phoneDisplay}
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#f3f5f2] dark:bg-zinc-900" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.18] blur-[3px] dark:opacity-[0.12]">
          <Image
            src="/movemate-movers-logo.png"
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover object-center mix-blend-multiply dark:mix-blend-screen"
          />
        </div>
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.3fr_0.7fr] lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-900 dark:border-emerald-300/20 dark:bg-zinc-950 dark:text-emerald-300">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Moving enquiries for Meru
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">
              Moving in Meru? Get a clear quote for your move.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-700 sm:text-lg dark:text-zinc-300">
              Contact MoveMate Movers about a house, apartment, bedsitter, student-room or shop move. Share what you
              are moving, where from and to, and the floor level at both locations.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#quote"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                Request a quote <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
              <a
                href={phoneHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 font-bold text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <Phone aria-hidden="true" className="h-4 w-4" /> Call {phoneDisplay}
              </a>
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              A call or WhatsApp message goes directly to MoveMate Movers.
            </p>
          </div>

          <aside id="quote-factors" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-[370px] overflow-hidden rounded-2xl border-2 border-[#ff5500] bg-[#ff5500]">
              <Image
                src="/movemate-movers-logo.png"
                alt="MoveMate Movers truck and house logo"
                width={1024}
                height={1024}
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#c2410c] dark:bg-[#3b2116] dark:text-orange-300">
              <CircleDollarSign aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-400">
              Quote factors
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Details shape the price</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              MoveMate confirms the price directly with you after considering the number of movers, workload, items,
              route and access at both buildings.
            </p>
            <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <p className="text-sm font-bold">Include these details:</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /> Items and approximate quantity</li>
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /> Number of movers needed</li>
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /> Pickup and delivery areas</li>
                <li className="flex gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /> Floor level at both places</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section id="team" className="border-y border-zinc-200 bg-[#fff7f0] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c2410c] dark:text-orange-300">MoveMate in action</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">A moving crew with a visible identity</h2>
            <p className="mt-4 leading-7 text-zinc-700 dark:text-zinc-300">
              These photos show MoveMate-branded workwear and the team beside a moving truck. Confirm the crew,
              vehicle and service details directly when you request a quote.
            </p>
          </div>
          <div className="mt-9 grid gap-8 md:grid-cols-2">
            {[
              {
                src: "/movemate-team-by-truck.webp",
                alt: "Two people beside a truck with a MoveMate Movers vest",
                caption: "MoveMate-branded equipment beside a moving truck.",
                width: 960,
                height: 1280,
              },
              {
                src: "/movemate-team-with-vest.webp",
                alt: "Two people holding a MoveMate Movers vest beside a truck",
                caption: "The MoveMate Movers vest and logo shown clearly.",
                width: 1280,
                height: 960,
              },
            ].map((photo) => (
              <figure key={photo.src} className="relative isolate">
                <div className="absolute inset-3 -z-10 overflow-hidden rounded-[2rem] opacity-45 blur-2xl dark:opacity-30">
                  <Image src={photo.src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="scale-110 object-cover" aria-hidden="true" />
                </div>
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-zinc-200 shadow-xl dark:border-zinc-800 dark:bg-zinc-800">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">Moving help</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Tell MoveMate what you need moved</h2>
          <p className="mt-4 leading-7 text-zinc-700 dark:text-zinc-300">
            MoveMate&apos;s shared service details describe these kinds of jobs. Ask the team to confirm whether they
            can handle your move and what is included before booking.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">Areas to ask about</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Moving around Meru County</h2>
            <p className="mt-4 max-w-xl leading-7 text-zinc-700 dark:text-zinc-300">
              MoveMate&apos;s shared service details name Meru Town, Makutano, Kaaga, Nchiru and Nkubu. Contact them to
              confirm availability for your exact pickup and delivery route.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Meru Town", "Makutano", "Kaaga", "Nchiru", "Nkubu"].map((area) => (
                <span key={area} className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-zinc-950 p-6 text-white sm:p-8 dark:bg-black">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-300">
                <Truck aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="text-xl font-bold">How to request a quote</h3>
            </div>
            <ol className="mt-6 space-y-4">
              {quoteSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-zinc-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-zinc-700 pt-5 text-sm leading-6 text-zinc-300">
              Ask directly whether packing, furniture assembly or other extra help is available; this page does not
              assume those services or their prices.
            </p>
          </div>
        </div>
      </section>

      <section id="quote" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">Get a price confirmed</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Request a moving quote</h2>
          <p className="mt-4 leading-7 text-zinc-700 dark:text-zinc-300">
            Fill in the route, the items and both floor levels. The form prepares a WhatsApp message for MoveMate
            Movers, so they can confirm availability and your final price.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 font-bold text-emerald-800 underline decoration-emerald-800/40 underline-offset-4 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Open WhatsApp without filling the form
          </a>
          <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
            Or call <a href={phoneHref} className="font-bold text-zinc-900 underline underline-offset-4 dark:text-zinc-100">{phoneDisplay}</a>.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <MoveMateQuoteForm />
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#f3f5f2] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <h2 className="text-2xl font-black tracking-tight">Before you book</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article>
              <h3 className="font-bold">How is the price confirmed?</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                Tell MoveMate the number of movers, workload and items, route, and floor level at both the pickup and
                destination so they can confirm the final quote.
              </p>
            </article>
            <article>
              <h3 className="font-bold">What should I send for a quote?</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                Send the item list and approximate quantity, pickup and delivery areas, both floor levels, and your
                preferred moving date. Mention stairs or lift access so the provider can assess the job.
              </p>
            </article>
          </div>
          <p className="mt-8 border-t border-zinc-300 pt-5 text-xs leading-5 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            This page helps you contact MoveMate Movers. Confirm the service, availability, included work and final
            price directly with the provider before making arrangements.
          </p>
        </div>
      </section>

      <footer className="bg-zinc-950 px-5 py-8 text-sm text-zinc-300 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/khejalink-logo.jpeg"
              alt="KhejaLink logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="font-bold text-white">MoveMate Movers · Meru County</p>
              <p className="mt-1 text-xs text-zinc-400">A moving service featured by KhejaLink</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/" className="hover:text-white">KhejaLink home</Link>
            <Link href="/properties" className="hover:text-white">Browse Meru rentals</Link>
            <a href={phoneHref} className="hover:text-white">Call {phoneDisplay}</a>
            <a
              href={SOCIAL.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow KhejaLink on TikTok ${SOCIAL.tiktok.handle}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-700 bg-white/5 px-4 py-2 font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/10 hover:text-white"
            >
              <TikTokIcon className="h-4 w-4" />
              <span>KhejaLink on TikTok</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
