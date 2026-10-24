import QRCode from "qrcode";
import Image from "next/image";
import { Smartphone, ShieldCheck, Download } from "lucide-react";

/**
 * The "get the app" band.
 *
 * The QR is rendered to a data URI on the server, so there is no client-side
 * QR library in the bundle and nothing to load before it paints. Someone opens
 * the site on a laptop, scans with their phone, and the download starts —
 * no typing a URL across devices.
 */

const APK_URL =
  "https://github.com/skiialpha001/Kheja_link/releases/download/v1.7.2/app-arm64-v8a-release.apk";

const FEATURES = [
  "Search every home, filter by area, rent and amenities",
  "Save homes — and get told the moment one frees up",
  "Unlock a landlord's contact by M-Pesa, right in the app",
];

export default async function AppDownloadQR() {
  // Dark modules on a transparent ground, so the same image works in both themes.
  const qr = await QRCode.toDataURL(APK_URL, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: { dark: "#18181bff", light: "#ffffffff" },
  });

  return (
    <section id="get-the-app" className="scroll-mt-24 px-4 pt-12 sm:px-6 sm:pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-[2.5rem] sm:p-8 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-[1.3fr_auto] lg:gap-16">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px]">
                <Smartphone className="w-4 h-4" />
                <span>Kheja_Link for Android</span>
              </div>

              <h2 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-4xl md:text-5xl">
                Scan. Install. <br className="hidden sm:block" />
                Start hunting.
              </h2>

              <p className="max-w-lg text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
                Point your phone camera at the code and the app downloads. Your saved
                homes and account work across both.
              </p>

              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    </span>
                    <span className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col items-stretch gap-4 pt-1 sm:flex-row sm:items-center">
                <a
                  href={APK_URL}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 font-semibold text-white transition-colors hover:bg-blue-800 sm:w-auto"
                >
                  <Download className="w-5 h-5" />
                  Download directly
                </a>
                <p className="max-w-sm text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                  If you install this APK directly, Android may ask you to allow
                  installs from your browser.
                </p>
              </div>
            </div>

            {/* The code itself */}
            <div className="justify-self-center lg:justify-self-end">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-700">
                <Image
                  src={qr}
                  alt="QR code to download the Kheja_Link Android app"
                  width={240}
                  height={240}
                  unoptimized
                  className="h-auto w-[min(200px,60vw)] sm:w-[240px]"
                />
                <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Scan with your camera
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
