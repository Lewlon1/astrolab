"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangText from "@/components/LangText";
import LangToggle from "@/components/LangToggle";

type NavLink = {
  href: string;
  labelEn: string;
  labelEs: string;
  cta?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/#founder", labelEn: "About", labelEs: "Sobre Mí" },
  { href: "/#tarot", labelEn: "Sessions", labelEs: "Sesiones" },
  { href: "/#magazine", labelEn: "Travel Magazine", labelEs: "Revista de Viaje" },
  { href: "/#reviews", labelEn: "Reviews", labelEs: "Reseñas" },
  { href: "/blog", labelEn: "Blog", labelEs: "Blog" },
];

const BOOK_LINK = {
  href: "/#book",
  labelEn: "Book Now",
  labelEs: "Reservar",
};

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "py-3 shadow-[0_2px_20px_rgba(0,0,0,0.06)]" : "py-[1.15rem]"
      }`}
      style={{
        background: "rgba(255, 248, 242, 0.88)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-display font-bold text-[1.05rem] tracking-[0.08em] uppercase text-[var(--deep-brown)] whitespace-nowrap"
        >
          The Astro Psyche <span className="text-[var(--gold)]">Lab</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-[1.4rem]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--text-muted)] hover:text-[var(--deep-brown)] text-[0.78rem] tracking-[0.04em] uppercase transition-colors whitespace-nowrap"
            >
              <LangText en={link.labelEn} es={link.labelEs} />
            </Link>
          ))}
          <LangToggle />
          <Link
            href={BOOK_LINK.href}
            className="bg-[var(--deep-brown)] text-white text-[0.78rem] font-medium px-5 py-[0.55rem] rounded-full hover:bg-[var(--mid-brown)] transition-colors uppercase tracking-[0.04em] whitespace-nowrap"
          >
            <LangText en={BOOK_LINK.labelEn} es={BOOK_LINK.labelEs} />
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <LangToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col gap-1.5 p-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span
              className={`block w-5 h-px bg-[var(--deep-brown)] transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[var(--deep-brown)] transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[var(--deep-brown)] transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden backdrop-blur-xl border-b border-black/5"
          style={{ background: "rgba(255, 248, 242, 0.96)" }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--deep-brown)] text-sm uppercase tracking-[0.04em] py-1"
              >
                <LangText en={link.labelEn} es={link.labelEs} />
              </Link>
            ))}
            <Link
              href={BOOK_LINK.href}
              onClick={() => setMobileOpen(false)}
              className="bg-[var(--deep-brown)] text-white text-sm font-medium px-5 py-2.5 rounded-full text-center mt-2 uppercase tracking-[0.04em]"
            >
              <LangText en={BOOK_LINK.labelEn} es={BOOK_LINK.labelEs} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
