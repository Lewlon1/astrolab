import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Outfit,
  Syne,
  Fraunces,
  Instrument_Serif,
  Spectral,
  DM_Mono,
  Caveat,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ManyChatScript from "@/components/ManyChatScript";
import MetaPixel from "@/components/MetaPixel";
import { ConsentProvider } from "@/context/ConsentContext";
import "./globals.css";

// Font preloading (readiness plan change 6): every page used to preload all 17
// font files (~430 KB) before showing text. Only the three families the first
// screen of the public and /apply pages needs are preloaded now: Spectral (the
// .editorial-page body), Fraunces (headlines) and DM Mono (labels). The rest still
// load, on demand, when a page actually uses them; display: "swap" shows a
// fallback meanwhile.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
  preload: false,
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
  preload: false,
});

// Editorial Cosmic fonts (public homepage redesign)
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "The Astro Psyche Lab | Astrology Meets Psychology",
    template: "%s | The Astro Psyche Lab",
  },
  description:
    "Astrology meets psychology. Birth chart readings, synastry, astrocartography, and cosmic workshops in Barcelona.",
  openGraph: {
    title: "The Astro Psyche Lab",
    description:
      "Astrology meets psychology. Birth chart readings, synastry, astrocartography, and cosmic workshops in Barcelona.",
    url: "https://theastropsychelab.com",
    siteName: "The Astro Psyche Lab",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${outfit.variable} ${syne.variable} ${fraunces.variable} ${instrumentSerif.variable} ${spectral.variable} ${dmMono.variable} ${caveat.variable}`}
    >
      <body className="antialiased font-body">
        <ConsentProvider>
          <MetaPixel />
          {children}
          <ManyChatScript />
        </ConsentProvider>
        <Analytics />
      </body>
    </html>
  );
}
