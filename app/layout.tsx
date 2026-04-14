import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import ManyChatScript from "@/components/ManyChatScript";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
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
      className={`${cormorant.variable} ${outfit.variable} ${syne.variable}`}
    >
      <body className="antialiased font-body">
        {children}
        <ManyChatScript />
        <Analytics />
      </body>
    </html>
  );
}
