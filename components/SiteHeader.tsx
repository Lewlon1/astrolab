"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangText from "@/components/LangText";
import { useLang } from "@/context/LangContext";
import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";
import { BRAND } from "@/lib/constants";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

type NavLink = {
  href: string;
  labelEn: string;
  labelEs: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/#founder", labelEn: "About", labelEs: "Sobre Mí" },
  { href: "/#tarot", labelEn: "Sessions", labelEs: "Sesiones" },
  { href: "/services", labelEn: "Services", labelEs: "Servicios" },
  {
    href: "/#magazine",
    labelEn: "Travel Magazine",
    labelEs: "Revista de Viaje",
  },
  { href: "/#reviews", labelEn: "Reviews", labelEs: "Reseñas" },
  { href: "/blog", labelEn: "Blog", labelEs: "Blog" },
];

const BOOK_LINK = {
  href: "/#book",
  labelEn: "Book a Session",
  labelEs: "Reservar",
};

type Props = {
  editorialDate?: EditorialDate;
};

export default function SiteHeader({ editorialDate }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { lang, setLang } = useLang();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const ed = editorialDate ?? getEditorialDate();
  const issueLabelEn = `Issue ${ed.issueNum} · ${ed.monthEn} ${ed.year}`;
  const issueLabelEs = `Número ${ed.issueNum} · ${ed.monthEs} ${ed.year}`;

  return (
    <header
      className="sticky top-0 z-[50]"
      style={{
        background: "var(--ed-paper)",
        borderBottom: "1px solid var(--ed-ink)",
      }}
    >
      {/* Masthead row */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center px-14 py-5 gap-6">
        <div
          className="font-dm-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            color: "var(--ed-text-mute)",
          }}
        >
          <LangText en={issueLabelEn} es={issueLabelEs} />
        </div>

        <Link
          href="/"
          className="font-fraunces text-center whitespace-nowrap"
          style={{
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--ed-ink)",
          }}
        >
          The Astro{" "}
          <em
            style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
          >
            Psyche
          </em>{" "}
          Lab
        </Link>

        <div className="flex items-center gap-3.5 justify-end">
          <div
            className="flex"
            style={{ fontSize: 10, letterSpacing: "0.14em" }}
          >
            <button
              onClick={() => setLang("en")}
              className="border-0 cursor-pointer font-medium font-dm-mono"
              style={{
                padding: "4px 10px",
                background: lang === "en" ? "var(--ed-ink)" : "transparent",
                color:
                  lang === "en" ? "var(--ed-paper)" : "var(--ed-text-mute)",
                borderRight: "1px solid var(--ed-rule)",
              }}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("es")}
              className="border-0 cursor-pointer font-medium font-dm-mono"
              style={{
                padding: "4px 10px",
                background: lang === "es" ? "var(--ed-ink)" : "transparent",
                color:
                  lang === "es" ? "var(--ed-paper)" : "var(--ed-text-mute)",
              }}
              aria-pressed={lang === "es"}
            >
              ES
            </button>
          </div>
          <a
            href={BRAND.site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-70 transition-opacity"
            style={{ color: "var(--ed-ink-soft)" }}
            aria-label="Instagram"
          >
            <InstagramIcon size={17} />
          </a>
          <Link
            href={BOOK_LINK.href}
            className="font-medium font-dm-mono uppercase"
            style={{
              background: "var(--ed-ink)",
              color: "var(--ed-paper)",
              padding: "10px 20px",
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textDecoration: "none",
            }}
          >
            <LangText en={BOOK_LINK.labelEn} es={BOOK_LINK.labelEs} />
          </Link>
        </div>
      </div>

      {/* Desktop nav row */}
      <nav
        className="hidden md:flex justify-center font-dm-mono uppercase"
        style={{
          gap: 38,
          padding: "14px 56px",
          borderTop: "1px solid var(--ed-rule)",
          fontSize: 10.5,
          letterSpacing: "0.24em",
          color: "var(--ed-ink-soft)",
        }}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:opacity-70 transition-opacity"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <LangText en={link.labelEn} es={link.labelEs} />
          </Link>
        ))}
      </nav>

      {/* Mobile masthead */}
      <div className="flex md:hidden items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="font-fraunces"
          style={{
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--ed-ink)",
          }}
        >
          The Astro{" "}
          <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
            Psyche
          </em>{" "}
          Lab
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex" style={{ fontSize: 10 }}>
            <button
              onClick={() => setLang("en")}
              className="border-0 cursor-pointer font-medium font-dm-mono"
              style={{
                padding: "3px 8px",
                background: lang === "en" ? "var(--ed-ink)" : "transparent",
                color:
                  lang === "en" ? "var(--ed-paper)" : "var(--ed-text-mute)",
              }}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("es")}
              className="border-0 cursor-pointer font-medium font-dm-mono"
              style={{
                padding: "3px 8px",
                background: lang === "es" ? "var(--ed-ink)" : "transparent",
                color:
                  lang === "es" ? "var(--ed-paper)" : "var(--ed-text-mute)",
              }}
              aria-pressed={lang === "es"}
            >
              ES
            </button>
          </div>
          <a
            href={BRAND.site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-70 transition-opacity"
            style={{ color: "var(--ed-ink-soft)" }}
            aria-label="Instagram"
          >
            <InstagramIcon size={18} />
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col gap-1.5 p-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span
              className={`block w-5 h-px transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
              style={{ background: "var(--ed-ink)" }}
            />
            <span
              className={`block w-5 h-px transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
              style={{ background: "var(--ed-ink)" }}
            />
            <span
              className={`block w-5 h-px transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
              style={{ background: "var(--ed-ink)" }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--ed-paper)",
            borderTop: "1px solid var(--ed-rule)",
          }}
        >
          <div className="px-5 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-dm-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--ed-ink-soft)",
                  textDecoration: "none",
                  padding: "6px 0",
                }}
              >
                <LangText en={link.labelEn} es={link.labelEs} />
              </Link>
            ))}
            <Link
              href={BOOK_LINK.href}
              onClick={() => setMobileOpen(false)}
              className="font-dm-mono uppercase text-center mt-2"
              style={{
                background: "var(--ed-ink)",
                color: "var(--ed-paper)",
                padding: "12px 20px",
                fontSize: 11,
                letterSpacing: "0.2em",
                textDecoration: "none",
              }}
            >
              <LangText en={BOOK_LINK.labelEn} es={BOOK_LINK.labelEs} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
