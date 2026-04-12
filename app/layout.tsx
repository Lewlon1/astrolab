import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import ManyChatScript from "@/components/ManyChatScript";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
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
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="antialiased font-body">
        {children}
        <ManyChatScript />
        <Analytics />
      </body>
    </html>
  );
}
