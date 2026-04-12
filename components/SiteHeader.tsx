"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-midnight/80 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-sm tracking-[0.2em] uppercase text-cream"
        >
          The Astro Psyche Lab
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors ${
                  isActive ? "text-cream" : "text-cream/50 hover:text-cream/80"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gold" />
                )}
              </Link>
            );
          })}
          <Link
            href="/book"
            className="bg-gold text-midnight text-sm font-medium px-5 py-2 rounded-[22px] hover:bg-gold/90 transition-colors"
          >
            Book now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block w-5 h-px bg-cream transition-all duration-300 ${
              mobileOpen ? "rotate-45 translate-y-[4px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-cream transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-cream transition-all duration-300 ${
              mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-midnight/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm transition-colors ${
                    isActive ? "text-gold" : "text-cream/65 hover:text-cream"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="bg-gold text-midnight text-sm font-medium px-5 py-2 rounded-[22px] hover:bg-gold/90 transition-colors text-center mt-2"
            >
              Book now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
