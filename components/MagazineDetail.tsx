"use client";

import { useState } from "react";
import LangText from "@/components/LangText";
import MagazinePreviewModal from "@/components/MagazinePreviewModal";
import { useLang } from "@/context/LangContext";
import BookAction from "@/components/booking/BookAction";
import { SERVICES } from "@/lib/booking";
import { track } from "@/lib/analytics/track";

const COVER_IMG =
  "https://images.unsplash.com/photo-1469028614971-4fd767d45eb3?fm=jpg&q=80&w=1400&auto=format&fit=crop";

// The travel magazine is an async deliverable → Stripe Payment Link.
const TRAVEL = SERVICES.travel.booking;
const TRAVEL_URL = TRAVEL.kind === "stripe" ? TRAVEL.url : "";

const FEATURES: Array<{
  num: string;
  headEn: string;
  headEs: string;
  descEn: string;
  descEs: string;
}> = [
  {
    num: "I.",
    headEn: "Top 5 Destinations",
    headEs: "Top 5 Destinos",
    descEn: "Cities on your strongest planetary lines.",
    descEs: "Ciudades en tus líneas planetarias más fuertes.",
  },
  {
    num: "II.",
    headEn: "Curated Activities",
    headEs: "Actividades Curadas",
    descEn: "Experiences matched to your chart.",
    descEs: "Experiencias por tu carta natal.",
  },
  {
    num: "III.",
    headEn: "Transit Timing",
    headEs: "Timing de Tránsitos",
    descEn: "Optimal months for each destination.",
    descEs: "Meses óptimos para cada destino.",
  },
  {
    num: "IV.",
    headEn: "Soul Rituals",
    headEs: "Rituales del Alma",
    descEn: "Prompts and intentions for each place.",
    descEs: "Intenciones y prácticas para cada lugar.",
  },
];

function MagazineCoverTeaser({
  onClick,
  lang,
}: {
  onClick: () => void;
  lang: "en" | "es";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        lang === "en"
          ? "Preview the Soul Guided Travel magazine"
          : "Vista previa de la revista Viaje Guiado del Alma"
      }
      className="group relative block w-full max-w-[420px] overflow-hidden cursor-pointer"
      style={{
        aspectRatio: "4 / 5",
        border: "1.5px solid var(--ed-rust)",
        boxShadow: "0 24px 64px -28px rgba(140, 62, 38, 0.55)",
        background: "var(--ed-paper)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={COVER_IMG}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ filter: "saturate(1.05) contrast(1.02)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(184,88,56,0.10) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(26,24,20,0.78) 100%)",
        }}
      />
      <div
        className="absolute font-dm-mono uppercase"
        style={{
          top: 22,
          left: 22,
          right: 110,
          fontSize: 9,
          letterSpacing: "0.32em",
          color: "rgba(244, 239, 230, 0.92)",
        }}
      >
        {lang === "en"
          ? "Vol. I · Spring/Summer · MMXXVI"
          : "Vol. I · Primavera/Verano · MMXXVI"}
      </div>
      <div
        className="absolute font-dm-mono uppercase flex items-center gap-2"
        style={{
          top: 18,
          right: 18,
          fontSize: 9,
          letterSpacing: "0.28em",
          color: "var(--ed-paper)",
          background: "var(--ed-rust)",
          padding: "6px 12px",
        }}
      >
        {lang === "en" ? "Preview" : "Vista Previa"} →
      </div>
      <div className="absolute" style={{ left: 22, right: 22, bottom: 24 }}>
        <div
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(34px, 4.5vw, 52px)",
            lineHeight: 0.95,
            color: "var(--ed-paper)",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          {lang === "en" ? (
            <>
              Soul Guided
              <br />
              Travel.
            </>
          ) : (
            <>
              Viaje Guiado
              <br />
              del Alma.
            </>
          )}
        </div>
        <div
          className="font-dm-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "rgba(244, 239, 230, 0.82)",
          }}
        >
          {lang === "en"
            ? "An Astrocartographic Almanac"
            : "Un Almanaque Astrocartográfico"}
        </div>
      </div>
    </button>
  );
}

export default function MagazineDetail() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { lang } = useLang();

  const openPreview = () => {
    setPreviewOpen(true);
    track("interaction", "magazine_preview_open");
  };

  return (
    <section
      id="magazine"
      className="px-6 md:px-14 py-20 md:py-[120px]"
      style={{ borderBottom: "1px solid var(--ed-rule)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Section marker */}
        <div className="flex items-center gap-4 mb-10 md:mb-14">
          <span
            className="font-dm-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--ed-text-mute)",
            }}
          >
            Pp. 28
          </span>
          <span
            className="flex-1"
            style={{ height: 1, background: "var(--ed-rule)" }}
          />
          <span
            className="font-dm-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              color: "var(--ed-rust)",
            }}
          >
            <LangText
              en="New · Digital Issue"
              es="Nuevo · Edición Digital"
            />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
          {/* LEFT: text */}
          <div className="pt-2 md:pt-5 order-2 md:order-1">
            <h2
              className="font-fraunces m-0 mb-8"
              style={{
                fontSize: "clamp(40px, 7vw, 88px)",
                fontWeight: 300,
                color: "var(--ed-ink)",
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              <LangText
                en={
                  <>
                    Travel,
                    <br />
                    <em
                      style={{
                        fontStyle: "italic",
                        color: "var(--ed-sky)",
                      }}
                    >
                      charted.
                    </em>
                  </>
                }
                es={
                  <>
                    Viajes,
                    <br />
                    <em
                      style={{
                        fontStyle: "italic",
                        color: "var(--ed-sky)",
                      }}
                    >
                      trazados.
                    </em>
                  </>
                }
              />
            </h2>
            <p
              className="font-spectral m-0 mb-7"
              style={{
                fontSize: 18,
                color: "var(--ed-ink-soft)",
                lineHeight: 1.7,
              }}
            >
              <LangText
                en="Not a horoscope guide. A bespoke digital magazine built around your natal chart and current transits — revealing where in the world your energy is strongest right now, and what to do when you arrive."
                es="No es una guía genérica. Una revista digital hecha a medida con tu carta natal y tus tránsitos actuales — revelando dónde en el mundo tu energía es más fuerte ahora, y qué hacer cuando llegues."
              />
            </p>

            <div style={{ borderTop: "1px solid var(--ed-ink)" }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.num}
                  className="grid grid-cols-[40px_1fr] gap-5 py-5"
                  style={{
                    borderBottom:
                      i < FEATURES.length - 1
                        ? "1px solid var(--ed-rule)"
                        : "none",
                  }}
                >
                  <span
                    className="font-fraunces"
                    style={{
                      fontStyle: "italic",
                      fontSize: 22,
                      color: "var(--ed-sky)",
                      fontWeight: 400,
                    }}
                  >
                    {f.num}
                  </span>
                  <div>
                    <div
                      className="font-fraunces mb-1"
                      style={{
                        fontSize: 19,
                        color: "var(--ed-ink)",
                      }}
                    >
                      <LangText en={f.headEn} es={f.headEs} />
                    </div>
                    <div
                      className="font-spectral"
                      style={{
                        fontSize: 14.5,
                        color: "var(--ed-text-mute)",
                        lineHeight: 1.55,
                      }}
                    >
                      <LangText en={f.descEn} es={f.descEs} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex items-baseline gap-6 flex-wrap">
              <span
                className="font-fraunces"
                style={{
                  fontSize: 48,
                  color: "var(--ed-ink)",
                  fontWeight: 400,
                }}
              >
                €75
              </span>
              <span
                className="font-spectral"
                style={{
                  fontSize: 12,
                  color: "var(--ed-text-mute)",
                  letterSpacing: "0.08em",
                }}
              >
                <LangText
                  en="Digital PDF · 5-day delivery"
                  es="PDF digital · entrega en 5 días"
                />
              </span>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <BookAction
                target={TRAVEL}
                label={<LangText en="Order Your Issue →" es="Pide Tu Edición →" />}
                analyticsName="cta_order_magazine"
                conversionName="booking_click"
                serviceSlug="soul-guided-travel-magazine"
                className="inline-block font-dm-mono uppercase mt-6"
                style={{
                  background: "var(--ed-ink)",
                  color: "var(--ed-paper)",
                  padding: "16px 32px",
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              />
              <button
                type="button"
                onClick={openPreview}
                className="inline-block font-dm-mono uppercase mt-6"
                style={{
                  background: "var(--ed-paper)",
                  color: "var(--ed-ink)",
                  border: "1px solid var(--ed-ink)",
                  padding: "15px 32px",
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <LangText
                  en="Preview the full edition →"
                  es="Vista previa de la edición completa →"
                />
              </button>
            </div>
          </div>

          {/* RIGHT: clickable magazine cover teaser (replaces Loupe) */}
          <div className="relative order-1 md:order-2 flex flex-col items-center justify-center">
            <MagazineCoverTeaser onClick={openPreview} lang={lang} />
          </div>
        </div>
      </div>

      <MagazinePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        orderUrl={TRAVEL_URL}
      />
    </section>
  );
}
