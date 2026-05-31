"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLang } from "@/context/LangContext";
import { WORLD_LAND_PATH } from "@/components/worldLandPath";

/* ---------- photo URLs (hotlinked) ---------- */
const PHOTOS = {
  cover:
    "https://images.unsplash.com/photo-1469028614971-4fd767d45eb3?fm=jpg&q=80&w=1400&auto=format&fit=crop",
  feature:
    "https://images.pexels.com/photos/34440892/pexels-photo-34440892.jpeg?auto=compress&cs=tinysrgb&w=1400",
  lisbon:
    "https://images.pexels.com/photos/34440892/pexels-photo-34440892.jpeg?auto=compress&cs=tinysrgb&w=900",
  kyoto:
    "https://images.pexels.com/photos/31295484/pexels-photo-31295484.jpeg?auto=compress&cs=tinysrgb&w=900",
  ubud: "https://images.unsplash.com/photo-1557093793-d149a38a1be8?fm=jpg&q=80&w=900&auto=format&fit=crop",
  oaxaca:
    "https://images.unsplash.com/photo-1562215589-b6d0ed3cfec8?fm=jpg&q=80&w=900&auto=format&fit=crop",
  reykjavik:
    "https://images.unsplash.com/photo-1630868499424-b38f9f885d66?fm=jpg&q=80&w=900&auto=format&fit=crop",
  marrakech:
    "https://images.pexels.com/photos/28730586/pexels-photo-28730586.jpeg?auto=compress&cs=tinysrgb&w=900",
} as const;

/* ---------- planet accent colors ---------- */
const PLANET = {
  gold: "#B88B3C",
  sage: "#7B8C72",
  sageDeep: "#4E5C49",
  rose: "#C97F6F",
  terracottaDeep: "#8C3E26",
} as const;

type Lang = "en" | "es";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  calendlyUrl: string;
};

/* ---------- bilingual helper ---------- */
function T({
  en,
  es,
  lang,
}: {
  en: ReactNode;
  es: ReactNode;
  lang: Lang;
}) {
  return <>{lang === "en" ? en : es}</>;
}

/* ============================================================
   MAIN MODAL
   ============================================================ */
export default function MagazinePreviewModal({
  isOpen,
  onClose,
  calendlyUrl,
}: Props) {
  const { lang: globalLang } = useLang();
  const [lang, setLang] = useState<Lang>(globalLang);

  // Re-sync local lang when modal opens with current global lang
  useEffect(() => {
    if (isOpen) setLang(globalLang);
  }, [isOpen, globalLang]);

  // Body scroll lock + ESC close
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === "en"
          ? "Soul Guided Travel magazine preview"
          : "Vista previa de la revista Viaje Guiado del Alma"
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto"
      style={{
        background: "rgba(42, 33, 27, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "magazine-fade-in .4s ease",
      }}
    >
      <style>{`
        @keyframes magazine-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes magazine-slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div
        className="relative w-full"
        style={{
          maxWidth: 1280,
          margin: "32px 16px",
          background: "var(--ed-paper-deep)",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.6)",
          animation: "magazine-slide-up .5s cubic-bezier(.2,.7,.3,1)",
        }}
      >
        <CloseButton onClose={onClose} />

        <div
          className="relative"
          style={{
            background: "var(--ed-paper-deep)",
            backgroundImage: [
              "radial-gradient(circle at 12% 8%, rgba(216, 152, 96, 0.10), transparent 40%)",
              "radial-gradient(circle at 88% 92%, rgba(184, 88, 56, 0.08), transparent 45%)",
            ].join(", "),
          }}
        >
          <Masthead lang={lang} setLang={setLang} />
          <Cover lang={lang} />
          <Editorial lang={lang} />
          <Contents lang={lang} />
          <Lines lang={lang} />
          <Feature lang={lang} />
          <Atlas lang={lang} />
          <Destinations lang={lang} />
          <PullQuote lang={lang} />
          <Closing lang={lang} calendlyUrl={calendlyUrl} />
          <Footer />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CLOSE BUTTON (sticky, top-right)
   ============================================================ */
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="sticky top-0 z-[100] flex justify-end pointer-events-none">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="pointer-events-auto"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--ed-ink)",
          color: "var(--ed-paper)",
          border: "none",
          fontSize: 22,
          lineHeight: 1,
          cursor: "pointer",
          margin: "16px 16px 0 0",
          fontFamily: "var(--font-outfit), sans-serif",
          transition: "background .3s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--ed-rust)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--ed-ink)";
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ============================================================
   MASTHEAD
   ============================================================ */
function Masthead({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <header
      className="flex items-center justify-between flex-wrap gap-2"
      style={{
        borderBottom: "1px solid var(--ed-rule)",
        padding: "18px 24px",
        fontSize: 11,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "var(--ed-ink-soft)",
      }}
    >
      <div
        className="font-syne"
        style={{ color: "var(--ed-rust)", fontWeight: 700 }}
      >
        The Astro Psyche Lab
      </div>
      <div className="font-syne hidden md:block" style={{ fontWeight: 500 }}>
        <T
          en="— Soul Guided Travel · Issue No. 01 —"
          es="— Viaje Guiado del Alma · Edición Nº 01 —"
          lang={lang}
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLang("en")}
          className="font-syne"
          style={{
            background: "none",
            border: "none",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: lang === "en" ? "var(--ed-ink)" : "var(--ed-ink-soft)",
            textTransform: "uppercase",
            fontWeight: lang === "en" ? 700 : 400,
            borderBottom:
              lang === "en" ? "1px solid var(--ed-rust)" : "1px solid transparent",
          }}
        >
          EN
        </button>
        <span style={{ color: "var(--ed-ink-soft)" }}>·</span>
        <button
          type="button"
          onClick={() => setLang("es")}
          className="font-syne"
          style={{
            background: "none",
            border: "none",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: lang === "es" ? "var(--ed-ink)" : "var(--ed-ink-soft)",
            textTransform: "uppercase",
            fontWeight: lang === "es" ? 700 : 400,
            borderBottom:
              lang === "es" ? "1px solid var(--ed-rust)" : "1px solid transparent",
          }}
        >
          ES
        </button>
      </div>
    </header>
  );
}

/* ============================================================
   COVER
   ============================================================ */
function Cover({ lang }: { lang: Lang }) {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-12 md:gap-[72px] items-end px-6 md:px-12 pt-12 md:pt-16 pb-16 md:pb-24"
      style={{ minHeight: "80vh" }}
    >
      <div className="relative">
        <div
          className="font-syne flex items-center gap-4"
          style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--ed-rust)",
            marginBottom: 28,
          }}
        >
          <T
            en="Vol. I · Spring/Summer · MMXXVI"
            es="Vol. I · Primavera/Verano · MMXXVI"
            lang={lang}
          />
          <span
            style={{
              flex: 1,
              height: 1,
              background: "var(--ed-rust)",
              opacity: 0.6,
            }}
          />
        </div>
        <h1
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(52px, 6.6vw, 108px)",
            lineHeight: 0.96,
            color: "var(--ed-ink)",
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}
        >
          <T
            lang={lang}
            en={
              <>
                Soul
                <br />
                Guided
                <br />
                <span style={{ color: "var(--ed-rust)" }}>Travel.</span>
              </>
            }
            es={
              <>
                Viaje
                <br />
                Guiado
                <br />
                <span style={{ color: "var(--ed-rust)" }}>del Alma.</span>
              </>
            }
          />
        </h1>
        <div
          className="font-syne"
          style={{
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "var(--ed-ink-soft)",
            marginBottom: 48,
          }}
        >
          <T
            en="An Astrocartographic Almanac"
            es="Un Almanaque Astrocartográfico"
            lang={lang}
          />
        </div>
        <div
          className="grid grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center"
          style={{
            borderTop: "1px solid var(--ed-rule)",
            paddingTop: 24,
          }}
        >
          <div>
            <div
              className="font-syne"
              style={{
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "var(--ed-ink-soft)",
              }}
            >
              <T en="Commissioned for" es="Encargada para" lang={lang} />
            </div>
            <div
              className="font-fraunces"
              style={{
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--ed-ink)",
                marginTop: 4,
              }}
            >
              Maya García-Pérez
            </div>
          </div>
          <div />
          <div
            className="font-syne"
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--ed-rust)",
              letterSpacing: "0.1em",
            }}
          >
            <T
              en="€75 · Edition of one"
              es="€75 · Edición única"
              lang={lang}
            />
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          boxShadow: "0 30px 80px -30px rgba(140, 62, 38, 0.5)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PHOTOS.cover}
          alt="Lisbon golden hour"
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ filter: "saturate(1.05) contrast(1.02)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(184, 88, 56, 0.15) 0%, transparent 30%, transparent 70%, rgba(42, 33, 27, 0.35) 100%)",
          }}
        />
        <div
          className="absolute font-syne text-right"
          style={{
            top: 20,
            right: 20,
            border: "1px solid rgba(250, 245, 234, 0.7)",
            padding: "10px 14px",
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(250, 245, 234, 0.9)",
            lineHeight: 1.5,
            backdropFilter: "blur(4px)",
            background: "rgba(42, 33, 27, 0.2)",
            zIndex: 2,
          }}
        >
          The Astro Psyche Lab
          <br />
          Barcelona · Est. MMXXIV
        </div>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="absolute"
          style={{
            bottom: 20,
            left: 20,
            width: 56,
            height: 56,
            color: "rgba(250, 245, 234, 0.85)",
            zIndex: 2,
          }}
        >
          <circle cx="32" cy="32" r="28" />
          <circle cx="32" cy="32" r="20" />
          <path
            d="M32 6 L36 32 L32 58 L28 32 Z"
            fill="currentColor"
            opacity="0.4"
          />
          <path
            d="M6 32 L32 28 L58 32 L32 36 Z"
            fill="currentColor"
            opacity="0.2"
          />
          <text
            x="32"
            y="14"
            textAnchor="middle"
            fontFamily="var(--font-syne)"
            fontSize="6"
            fill="currentColor"
          >
            N
          </text>
          <text
            x="32"
            y="55"
            textAnchor="middle"
            fontFamily="var(--font-syne)"
            fontSize="6"
            fill="currentColor"
          >
            S
          </text>
        </svg>
      </div>
    </section>
  );
}

/* ============================================================
   EDITORIAL LETTER
   ============================================================ */
function Editorial({ lang }: { lang: Lang }) {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-12 md:gap-[96px] items-start px-6 md:px-12 py-16 md:py-20"
      style={{ borderTop: "1px solid var(--ed-rule)" }}
    >
      <div>
        <div
          className="font-syne"
          style={{
            fontSize: 11,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: "var(--ed-rust)",
            marginBottom: 14,
          }}
        >
          <T en="From the Astrologer" es="De la Astróloga" lang={lang} />
        </div>
        <h2
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: 40,
            lineHeight: 1.05,
            color: "var(--ed-ink)",
          }}
        >
          <T
            lang={lang}
            en={
              <>
                A letter, before
                <br />
                you begin to read.
              </>
            }
            es={
              <>
                Una carta, antes
                <br />
                de empezar a leer.
              </>
            }
          />
        </h2>
      </div>
      <div
        style={{
          fontSize: 17,
          lineHeight: 1.78,
          color: "var(--ed-ink-soft)",
        }}
      >
        <p style={{ marginBottom: 18 }}>
          <span
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: 68,
              lineHeight: 0.85,
              float: "left",
              padding: "8px 14px 0 0",
              color: "var(--ed-rust)",
            }}
          >
            M
          </span>
          <T
            lang={lang}
            en="aya, this magazine is yours. Inside, you will find the seven places on earth where the planets you were born under are alive in the sky right now — and what each of them might offer you if you stood beneath them."
            es="aya, esta revista es tuya. Dentro encontrarás los siete lugares de la tierra donde los planetas bajo los que naciste están vivos en el cielo ahora mismo — y lo que cada uno podría ofrecerte si te detuvieras bajo ellos."
          />
        </p>
        <p style={{ marginBottom: 18 }}>
          <T
            lang={lang}
            en="Astrocartography isn't about destiny. It's a map of the moods a place might draw out of you. Some lines soften you. Some sharpen you. None of them are escape — but a few of them are exactly where you'll feel like you can hear yourself again."
            es="La astrocartografía no trata del destino. Es un mapa de los estados de ánimo que un lugar puede sacar de ti. Algunas líneas te ablandan. Otras te afilan. Ninguna es una fuga — pero unas pocas son exactamente donde sentirás que puedes volver a escucharte."
          />
        </p>
        <p style={{ marginBottom: 18 }}>
          <T
            lang={lang}
            en="Read it slow. Mark the pages. The places that pull at you when you look at the map — those are usually the ones to trust."
            es="Léelo despacio. Marca las páginas. Los lugares que tiran de ti cuando miras el mapa — esos suelen ser los que vale la pena escuchar."
          />
        </p>
        <div
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: 22,
            color: "var(--ed-ink)",
            marginTop: 28,
          }}
        >
          — Gabriela
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CONTENTS
   ============================================================ */
function Contents({ lang }: { lang: Lang }) {
  const rows: Array<{
    num: string;
    titleEn: string;
    titleEs: string;
    subEn: string;
    subEs: string;
    page: string;
  }> = [
    {
      num: "01.",
      titleEn: "Your Lines",
      titleEs: "Tus Líneas",
      subEn: "The five planetary currents that shape you abroad",
      subEs: "Las cinco corrientes planetarias que te dan forma en el extranjero",
      page: "P. 04",
    },
    {
      num: "02.",
      titleEn: "The Feature",
      titleEs: "El Reportaje",
      subEn: "Lisbon — your Venus line at the Atlantic",
      subEs: "Lisboa — tu línea de Venus en el Atlántico",
      page: "P. 09",
    },
    {
      num: "03.",
      titleEn: "The Atlas",
      titleEs: "El Atlas",
      subEn: "MC, IC, AC and DC lines for five planets across the world",
      subEs: "Líneas MC, IC, AC y DC de cinco planetas por todo el mundo",
      page: "P. 14",
    },
    {
      num: "04.",
      titleEn: "Where to Go For…",
      titleEs: "Adónde Ir Para…",
      subEn: "Six destinations, each chosen for a season of your life",
      subEs: "Seis destinos, cada uno elegido para una temporada de tu vida",
      page: "P. 18",
    },
    {
      num: "05.",
      titleEn: "The Almanac",
      titleEs: "El Almanaque",
      subEn: "Best months to travel · Lines to avoid · One ritual per place",
      subEs: "Mejores meses para viajar · Líneas a evitar · Un ritual por lugar",
      page: "P. 24",
    },
    {
      num: "06.",
      titleEn: "A Closing Note",
      titleEs: "Una Nota Final",
      subEn: "On returning home — and what's allowed to come with you",
      subEs: "Sobre volver a casa — y qué tiene permiso de venir contigo",
      page: "P. 28",
    },
  ];

  return (
    <section
      className="px-6 md:px-12 py-16 md:py-20"
      style={{
        background: "var(--ed-paper)",
        borderTop: "1px solid var(--ed-rule)",
        borderBottom: "1px solid var(--ed-rule)",
      }}
    >
      <div className="flex justify-between items-baseline mb-12 md:mb-14 flex-wrap gap-4">
        <h2
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(40px, 5vw, 56px)",
            color: "var(--ed-ink)",
          }}
        >
          <T en="Contents" es="Índice" lang={lang} />
        </h2>
        <div
          className="font-syne"
          style={{
            fontSize: 11,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: "var(--ed-ink-soft)",
          }}
        >
          <T
            en="Six chapters · Twenty-eight pages"
            es="Seis capítulos · Veintiocho páginas"
            lang={lang}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20">
        {rows.map((r) => (
          <div
            key={r.num}
            className="grid grid-cols-[56px_1fr_auto] items-baseline gap-6"
            style={{
              padding: "24px 0",
              borderBottom: "1px solid var(--ed-rule)",
            }}
          >
            <div
              className="font-syne"
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "var(--ed-rust)",
                letterSpacing: "0.12em",
              }}
            >
              {r.num}
            </div>
            <div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "var(--ed-ink)",
                  marginBottom: 4,
                }}
              >
                {lang === "en" ? r.titleEn : r.titleEs}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ed-ink-soft)",
                }}
              >
                {lang === "en" ? r.subEn : r.subEs}
              </div>
            </div>
            <div
              className="font-syne"
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: "var(--ed-ink-soft)",
                letterSpacing: "0.2em",
              }}
            >
              {r.page}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   YOUR LINES (5 planet cards)
   ============================================================ */
function Lines({ lang }: { lang: Lang }) {
  const cards: Array<{
    glyph: string;
    color: string;
    name: string;
    archetypeEn: ReactNode;
    archetypeEs: ReactNode;
    descEn: string;
    descEs: string;
  }> = [
    {
      glyph: "☉",
      color: PLANET.gold,
      name: "Sun",
      archetypeEn: (
        <>
          Where you
          <br />
          become visible.
        </>
      ),
      archetypeEs: (
        <>
          Donde te vuelves
          <br />
          visible.
        </>
      ),
      descEn:
        "A line of confidence, of being seen, of taking up space you usually shrink from. Excellent for reinvention. Risky if you needed to hide.",
      descEs:
        "Una línea de confianza, de ser vista, de ocupar el espacio del que sueles encogerte. Excelente para reinventarse. Arriesgada si necesitabas esconderte.",
    },
    {
      glyph: "☽",
      color: PLANET.sage,
      name: "Moon",
      archetypeEn: (
        <>
          Where your nervous
          <br />
          system rests.
        </>
      ),
      archetypeEs: (
        <>
          Donde tu sistema
          <br />
          nervioso descansa.
        </>
      ),
      descEn:
        "Soft places. The food is familiar before you have tasted it. You sleep deeply. Best for grief, recovery, the first months of motherhood.",
      descEs:
        "Lugares blandos. La comida te resulta familiar antes de haberla probado. Duermes profundo. Mejor para el duelo, la recuperación, los primeros meses de la maternidad.",
    },
    {
      glyph: "♀",
      color: PLANET.rose,
      name: "Venus",
      archetypeEn: (
        <>
          Where beauty
          <br />
          finds you back.
        </>
      ),
      archetypeEs: (
        <>
          Donde la belleza
          <br />
          te devuelve la mirada.
        </>
      ),
      descEn:
        "Love, taste, pleasure, art. You will spend money here. You will also probably remember why you started making things in the first place.",
      descEs:
        "Amor, gusto, placer, arte. Aquí gastarás dinero. Y probablemente también recordarás por qué empezaste a crear cosas.",
    },
    {
      glyph: "♃",
      color: PLANET.sageDeep,
      name: "Jupiter",
      archetypeEn: (
        <>
          Where the world
          <br />
          says yes.
        </>
      ),
      archetypeEs: (
        <>
          Donde el mundo
          <br />
          dice sí.
        </>
      ),
      descEn:
        "Opportunity arrives in conversations you didn't engineer. Doors open. Caution: it is also the line where you overcommit and overspend.",
      descEs:
        "La oportunidad llega en conversaciones que no orquestaste. Las puertas se abren. Cuidado: también es la línea donde te comprometes y gastas de más.",
    },
    {
      glyph: "♄",
      color: PLANET.terracottaDeep,
      name: "Saturn",
      archetypeEn: (
        <>
          Where the work
          <br />
          actually gets done.
        </>
      ),
      archetypeEs: (
        <>
          Donde el trabajo
          <br />
          de verdad se hace.
        </>
      ),
      descEn:
        "Slow, structuring, sometimes lonely. You finish the book here. You stop drinking here. Don't travel here to relax — travel here to commit.",
      descEs:
        "Lenta, estructurante, a veces solitaria. Aquí terminas el libro. Aquí dejas de beber. No vayas a esta línea para descansar — ve para comprometerte.",
    },
  ];

  return (
    <section className="px-6 md:px-12 py-20 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-[72px] items-end mb-12 md:mb-14">
        <div>
          <div
            className="font-syne"
            style={{
              fontSize: 11,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "var(--ed-rust)",
              marginBottom: 18,
            }}
          >
            <T en="Chapter One" es="Capítulo Uno" lang={lang} />
          </div>
          <h2
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: "clamp(44px, 5.5vw, 76px)",
              lineHeight: 0.98,
              color: "var(--ed-ink)",
            }}
          >
            <T
              lang={lang}
              en={
                <>
                  Your
                  <br />
                  Lines.
                </>
              }
              es={
                <>
                  Tus
                  <br />
                  Líneas.
                </>
              }
            />
          </h2>
        </div>
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: "var(--ed-ink-soft)",
          }}
        >
          <T
            lang={lang}
            en="Every planet that was in the sky the moment you were born still casts four lines across the earth today. Five planets matter for travel. Each line is a doorway — into a part of yourself that a particular place will, kindly or not, insist that you meet."
            es="Cada planeta que estaba en el cielo el momento en que naciste todavía proyecta cuatro líneas por la tierra hoy. Cinco planetas importan para el viaje. Cada línea es una puerta — hacia una parte de ti que un lugar concreto, con amabilidad o no, insistirá en que conozcas."
          />
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-5 sm:grid-cols-2"
        style={{
          borderTop: "1px solid var(--ed-rule)",
          borderBottom: "1px solid var(--ed-rule)",
        }}
      >
        {cards.map((c, i) => (
          <div
            key={c.name}
            style={{
              padding: "28px 22px 24px",
              borderRight:
                i < cards.length - 1
                  ? "1px solid var(--ed-rule)"
                  : "none",
              borderBottom: "1px solid var(--ed-rule)",
            }}
            className="last:border-r-0 md:border-b-0"
          >
            <div style={{ height: 3, width: 40, background: c.color, marginBottom: 22 }} />
            <div
              className="font-fraunces"
              style={{
                fontSize: 48,
                lineHeight: 1,
                marginBottom: 18,
                color: c.color,
              }}
            >
              {c.glyph}
            </div>
            <div
              className="font-syne"
              style={{
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--ed-ink)",
                marginBottom: 10,
              }}
            >
              {c.name}
            </div>
            <div
              className="font-fraunces"
              style={{
                fontStyle: "italic",
                fontSize: 18,
                lineHeight: 1.25,
                color: "var(--ed-ink)",
                marginBottom: 14,
              }}
            >
              {lang === "en" ? c.archetypeEn : c.archetypeEs}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--ed-ink-soft)",
              }}
            >
              {lang === "en" ? c.descEn : c.descEs}
            </div>
            <div
              className="flex gap-1.5"
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: "1px dotted var(--ed-rule)",
              }}
            >
              {["MC", "AC", "IC", "DC"].map((chip) => (
                <span
                  key={chip}
                  className="font-syne"
                  style={{
                    fontWeight: 700,
                    fontSize: 8.5,
                    letterSpacing: "0.16em",
                    padding: "3px 7px",
                    border: "1px solid var(--ed-rule)",
                    color: "var(--ed-ink-soft)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURE — Lisbon
   ============================================================ */
function Feature({ lang }: { lang: Lang }) {
  return (
    <section
      className="px-6 md:px-12 py-20 md:py-24"
      style={{
        background: "var(--ed-paper)",
        borderTop: "1px solid var(--ed-rule)",
        borderBottom: "1px solid var(--ed-rule)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-12 md:gap-[72px] items-center">
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: "4 / 5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS.feature}
              alt="Lisbon azulejo facade"
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ filter: "saturate(1.08) contrast(1.03)" }}
            />
          </div>
          <div
            className="font-syne"
            style={{
              position: "absolute",
              bottom: -26,
              left: 0,
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--ed-ink-soft)",
            }}
          >
            <T
              en="— Plate I · Príncipe Real at 19:42"
              es="— Lámina I · Príncipe Real a las 19:42"
              lang={lang}
            />
          </div>
        </div>

        <div>
          <div
            className="font-syne"
            style={{
              fontSize: 11,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "var(--ed-rust)",
              marginBottom: 14,
            }}
          >
            <T
              en="The Feature · Page 09"
              es="El Reportaje · Página 09"
              lang={lang}
            />
          </div>
          <h3
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: "clamp(44px, 5.5vw, 60px)",
              lineHeight: 1,
              color: "var(--ed-ink)",
              marginBottom: 12,
            }}
          >
            <T en="Lisbon." es="Lisboa." lang={lang} />
          </h3>
          <div
            className="font-syne"
            style={{
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--ed-ink-soft)",
              marginBottom: 28,
            }}
          >
            <T
              en="Portugal · 38.7°N, 9.1°W · Venus MC × Sun DC"
              es="Portugal · 38.7°N, 9.1°O · Venus MC × Sol DC"
              lang={lang}
            />
          </div>
          <p
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: 21,
              lineHeight: 1.4,
              color: "var(--ed-ink)",
              marginBottom: 26,
              borderLeft: "2px solid var(--ed-rust)",
              paddingLeft: 22,
            }}
          >
            <T
              lang={lang}
              en={
                <>
                  &ldquo;Your Venus MC line crosses the Atlantic here — almost
                  exactly where the sun sets on the longest day of the
                  year.&rdquo;
                </>
              }
              es={
                <>
                  &ldquo;Tu línea de Venus MC cruza el Atlántico aquí — casi
                  exactamente donde se pone el sol en el día más largo del
                  año.&rdquo;
                </>
              }
            />
          </p>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: "var(--ed-ink-soft)",
            }}
          >
            <p style={{ marginBottom: 14 }}>
              <T
                lang={lang}
                en="Of every place on your map, this is the one you have probably already been pulled toward without knowing why. Your Venus is in Taurus — slow, sensual, tactile — and Lisbon is one of the few cities in Europe where Venusian living is still the default speed. Long lunches. Real plates. Salt in the air."
                es="De todos los lugares de tu mapa, este es el que probablemente ya te ha atraído sin saber por qué. Tu Venus está en Tauro — lenta, sensual, táctil — y Lisboa es una de las pocas ciudades de Europa donde la vida venusiana sigue siendo la velocidad por defecto. Comidas largas. Platos de verdad. Sal en el aire."
              />
            </p>
            <p style={{ marginBottom: 14 }}>
              <T
                lang={lang}
                en="Go in late spring, before the city becomes other people's holiday. Stay in Príncipe Real. Walk to Estrela in the morning. Eat octopus at a place you didn't research. Buy something handmade you didn't budget for. Notice what you stop apologising for after three days."
                es="Ve a finales de primavera, antes de que la ciudad se convierta en las vacaciones de otros. Quédate en Príncipe Real. Camina hasta Estrela por la mañana. Come pulpo en un sitio que no buscaste antes. Compra algo hecho a mano que no presupuestaste. Date cuenta de qué cosas dejas de pedir perdón después de tres días."
              />
            </p>
          </div>
          <div
            className="grid grid-cols-3 gap-6"
            style={{
              borderTop: "1px solid var(--ed-rule)",
              marginTop: 28,
              paddingTop: 22,
            }}
          >
            <div>
              <div
                className="font-syne"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--ed-ink-soft)",
                  marginBottom: 6,
                }}
              >
                <T en="Line Type" es="Tipo de Línea" lang={lang} />
              </div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 19,
                  color: "var(--ed-ink)",
                }}
              >
                Venus MC
              </div>
            </div>
            <div>
              <div
                className="font-syne"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--ed-ink-soft)",
                  marginBottom: 6,
                }}
              >
                <T en="Best Season" es="Mejor Temporada" lang={lang} />
              </div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 19,
                  color: "var(--ed-ink)",
                }}
              >
                <T en="May–June" es="Mayo–Junio" lang={lang} />
              </div>
            </div>
            <div>
              <div
                className="font-syne"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--ed-ink-soft)",
                  marginBottom: 6,
                }}
              >
                <T en="Stay For" es="Quédate" lang={lang} />
              </div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 19,
                  color: "var(--ed-ink)",
                }}
              >
                <T en="5–9 days" es="5–9 días" lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   ATLAS (the big SVG)
   ============================================================ */
function Atlas({ lang }: { lang: Lang }) {
  return (
    <section className="px-6 md:px-12 py-20 md:py-24">
      <div className="text-center mb-12">
        <div
          className="font-syne"
          style={{
            fontSize: 11,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: "var(--ed-rust)",
            marginBottom: 18,
          }}
        >
          <T en="Chapter Three" es="Capítulo Tres" lang={lang} />
        </div>
        <h2
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(48px, 7vw, 92px)",
            lineHeight: 1,
            color: "var(--ed-ink)",
          }}
        >
          <T en="The Atlas." es="El Atlas." lang={lang} />
        </h2>
        <div
          style={{
            fontSize: 15,
            color: "var(--ed-ink-soft)",
            maxWidth: 580,
            margin: "18px auto 0",
            lineHeight: 1.7,
          }}
        >
          <T
            lang={lang}
            en="MC lines run vertically, where a planet was at the top of the sky. AC lines curve like waves, where a planet was rising on the horizon. Where any two cross, you have a power point — marked here in terracotta."
            es="Las líneas MC corren verticalmente, donde un planeta estaba en lo alto del cielo. Las líneas AC se curvan como olas, donde un planeta estaba surgiendo en el horizonte. Donde dos se cruzan, tienes un punto de poder — marcado aquí en terracota."
          />
        </div>
      </div>

      <div
        className="relative"
        style={{
          background: "var(--ed-paper)",
          border: "1px solid var(--ed-rule)",
          padding: "32px 32px 24px",
        }}
      >
        {[
          { tl: { top: 12, left: 12 } },
          { tr: { top: 12, right: 12 } },
          { bl: { bottom: 12, left: 12 } },
          { br: { bottom: 12, right: 12 } },
        ].map((_, i) => {
          const positions = [
            { top: 12, left: 12, brRight: "none", brBottom: "none" },
            { top: 12, right: 12, brLeft: "none", brBottom: "none" },
            { bottom: 12, left: 12, brRight: "none", brTop: "none" },
            { bottom: 12, right: 12, brLeft: "none", brTop: "none" },
          ];
          const p = positions[i];
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 18,
                height: 18,
                border: "1px solid var(--ed-rust)",
                top: p.top,
                bottom: p.bottom,
                left: p.left,
                right: p.right,
                borderRight: p.brRight,
                borderBottom: p.brBottom,
                borderLeft: p.brLeft,
                borderTop: p.brTop,
              }}
            />
          );
        })}

        <AtlasSVG />

        <div
          className="flex justify-center gap-7 mt-5"
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--ed-ink-soft)",
          }}
        >
          <span className="font-syne flex items-center gap-2">
            <span
              style={{
                width: 22,
                height: 0,
                borderTop: "2px solid var(--ed-ink-soft)",
              }}
            />
            <T en="MC / IC (solid)" es="MC / IC (sólida)" lang={lang} />
          </span>
          <span className="font-syne flex items-center gap-2">
            <span
              style={{
                width: 22,
                height: 0,
                borderTop: "2px dashed var(--ed-ink-soft)",
              }}
            />
            <T en="AC / DC (dashed)" es="AC / DC (discontinua)" lang={lang} />
          </span>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-5 mt-7 pt-6"
          style={{ borderTop: "1px solid var(--ed-rule)" }}
        >
          {[
            {
              p: "Sun",
              glyph: "☉",
              color: PLANET.gold,
              en: "vitality · visibility",
              es: "vitalidad · visibilidad",
            },
            {
              p: "Moon",
              glyph: "☽",
              color: PLANET.sage,
              en: "rest · belonging",
              es: "descanso · pertenencia",
            },
            {
              p: "Venus",
              glyph: "♀",
              color: PLANET.rose,
              en: "love · beauty",
              es: "amor · belleza",
            },
            {
              p: "Jupiter",
              glyph: "♃",
              color: PLANET.sageDeep,
              en: "expansion · luck",
              es: "expansión · suerte",
            },
            {
              p: "Saturn",
              glyph: "♄",
              color: PLANET.terracottaDeep,
              en: "structure · finishing",
              es: "estructura · terminar",
            },
          ].map((item) => (
            <div key={item.p} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="font-fraunces"
                  style={{ fontSize: 16, width: 18, color: item.color }}
                >
                  {item.glyph}
                </span>
                <span
                  style={{ width: 26, height: 2, background: item.color }}
                />
              </div>
              <div
                className="font-syne"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--ed-ink-soft)",
                }}
              >
                {item.p}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ed-ink-soft)",
                  marginTop: 2,
                }}
              >
                {lang === "en" ? item.en : item.es}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AtlasSVG() {
  return (
    <svg
      viewBox="0 0 1000 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* graticule */}
      <g stroke="#2A211B" strokeWidth="0.3" opacity="0.1">
        <line x1="0" y1="125" x2="1000" y2="125" />
        <line x1="0" y1="250" x2="1000" y2="250" strokeWidth="0.4" />
        <line x1="0" y1="375" x2="1000" y2="375" />
        <line x1="125" y1="0" x2="125" y2="500" />
        <line x1="250" y1="0" x2="250" y2="500" />
        <line x1="375" y1="0" x2="375" y2="500" />
        <line x1="500" y1="0" x2="500" y2="500" strokeWidth="0.4" />
        <line x1="625" y1="0" x2="625" y2="500" />
        <line x1="750" y1="0" x2="750" y2="500" />
        <line x1="875" y1="0" x2="875" y2="500" />
      </g>

      {/* continents — real Natural Earth coastlines, equirectangular */}
      <path
        d={WORLD_LAND_PATH}
        fill="#2A211B"
        fillRule="evenodd"
        opacity="0.78"
      />
      <path
        d={WORLD_LAND_PATH}
        fill="none"
        stroke="#2A211B"
        strokeWidth="0.5"
        strokeLinejoin="round"
        opacity="0.5"
      />

      {/* SUN — gold */}
      <line x1="232" y1="0" x2="232" y2="500" stroke={PLANET.gold} strokeWidth="1.6" opacity="0.85" />
      <text x="237" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.gold}>☉ MC</text>
      <line x1="732" y1="0" x2="732" y2="500" stroke={PLANET.gold} strokeWidth="1.6" opacity="0.6" />
      <text x="737" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.gold} opacity="0.7">☉ IC</text>
      <path d="M 0 380 Q 130 360 260 310 Q 400 250 540 200 Q 700 160 880 145 Q 940 145 1000 150" stroke={PLANET.gold} strokeWidth="1.6" fill="none" strokeDasharray="5 3" opacity="0.8" />
      <text x="60" y="360" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="10" fill={PLANET.gold}>☉ AC</text>

      {/* MOON — sage */}
      <line x1="820" y1="0" x2="820" y2="500" stroke={PLANET.sage} strokeWidth="1.6" opacity="0.85" />
      <text x="825" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.sage}>☽ MC</text>
      <line x1="320" y1="0" x2="320" y2="500" stroke={PLANET.sage} strokeWidth="1.6" opacity="0.6" />
      <text x="325" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.sage} opacity="0.7">☽ IC</text>
      <path d="M 0 200 Q 150 220 290 250 Q 450 290 600 320 Q 780 350 1000 340" stroke={PLANET.sage} strokeWidth="1.6" fill="none" strokeDasharray="5 3" opacity="0.8" />
      <text x="900" y="330" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="10" fill={PLANET.sage}>☽ AC</text>

      {/* VENUS — rose */}
      <line x1="475" y1="0" x2="475" y2="500" stroke={PLANET.rose} strokeWidth="2" opacity="0.92" />
      <text x="480" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.rose} fontWeight="600">♀ MC</text>
      <line x1="975" y1="0" x2="975" y2="500" stroke={PLANET.rose} strokeWidth="1.6" opacity="0.6" />
      <text x="945" y="14" textAnchor="end" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.rose} opacity="0.7">♀ IC</text>
      <path d="M 0 90 Q 130 130 270 175 Q 420 235 570 285 Q 720 320 880 340 Q 940 345 1000 345" stroke={PLANET.rose} strokeWidth="1.6" fill="none" strokeDasharray="5 3" opacity="0.8" />
      <text x="710" y="328" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="10" fill={PLANET.rose}>♀ AC</text>

      {/* JUPITER — sage-deep */}
      <line x1="877" y1="0" x2="877" y2="500" stroke={PLANET.sageDeep} strokeWidth="2" opacity="0.92" />
      <text x="882" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.sageDeep} fontWeight="600">♃ MC</text>
      <line x1="377" y1="0" x2="377" y2="500" stroke={PLANET.sageDeep} strokeWidth="1.6" opacity="0.6" />
      <text x="382" y="14" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.sageDeep} opacity="0.7">♃ IC</text>
      <path d="M 0 280 Q 180 290 340 295 Q 510 300 670 285 Q 830 265 1000 240" stroke={PLANET.sageDeep} strokeWidth="1.6" fill="none" strokeDasharray="5 3" opacity="0.8" />
      <text x="40" y="275" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="10" fill={PLANET.sageDeep}>♃ AC</text>

      {/* SATURN — terracotta-deep */}
      <line x1="440" y1="0" x2="440" y2="500" stroke={PLANET.terracottaDeep} strokeWidth="1.6" opacity="0.85" />
      <text x="408" y="14" textAnchor="end" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.terracottaDeep}>♄ MC</text>
      <line x1="940" y1="0" x2="940" y2="500" stroke={PLANET.terracottaDeep} strokeWidth="1.6" opacity="0.6" />
      <text x="908" y="14" textAnchor="end" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="11" fill={PLANET.terracottaDeep} opacity="0.7">♄ IC</text>
      <path d="M 0 460 Q 150 440 290 410 Q 440 370 590 320 Q 740 270 880 240 Q 940 230 1000 225" stroke={PLANET.terracottaDeep} strokeWidth="1.6" fill="none" strokeDasharray="5 3" opacity="0.8" />
      <text x="600" y="312" fontFamily="var(--font-fraunces)" fontStyle="italic" fontSize="10" fill={PLANET.terracottaDeep}>♄ AC</text>

      {/* Power Points */}
      <g>
        <circle cx="475" cy="142" r="6" fill="#B85838" />
        <circle cx="475" cy="142" r="11" fill="none" stroke="#B85838" strokeWidth="0.8" opacity="0.6" />
        <text x="487" y="138" fontFamily="var(--font-syne)" fontWeight="700" fontSize="11" fill="#2A211B" letterSpacing="0.5">LISBON</text>
        <text x="487" y="150" fontFamily="var(--font-outfit)" fontSize="9" fill="#5A4A3F" fontStyle="italic">Venus MC × Sun AC</text>

        <circle cx="877" cy="153" r="6" fill="#B85838" />
        <circle cx="877" cy="153" r="11" fill="none" stroke="#B85838" strokeWidth="0.8" opacity="0.6" />
        <text x="864" y="138" textAnchor="end" fontFamily="var(--font-syne)" fontWeight="700" fontSize="11" fill="#2A211B" letterSpacing="0.5">KYOTO</text>
        <text x="864" y="150" textAnchor="end" fontFamily="var(--font-outfit)" fontSize="9" fill="#5A4A3F" fontStyle="italic">Jupiter MC</text>

        <circle cx="232" cy="203" r="6" fill="#B85838" />
        <circle cx="232" cy="203" r="11" fill="none" stroke="#B85838" strokeWidth="0.8" opacity="0.6" />
        <text x="222" y="195" textAnchor="end" fontFamily="var(--font-syne)" fontWeight="700" fontSize="11" fill="#2A211B" letterSpacing="0.5">OAXACA</text>
        <text x="222" y="207" textAnchor="end" fontFamily="var(--font-outfit)" fontSize="9" fill="#5A4A3F" fontStyle="italic">Sun MC</text>

        <circle cx="820" cy="273" r="6" fill="#B85838" />
        <circle cx="820" cy="273" r="11" fill="none" stroke="#B85838" strokeWidth="0.8" opacity="0.6" />
        <text x="833" y="270" fontFamily="var(--font-syne)" fontWeight="700" fontSize="11" fill="#2A211B" letterSpacing="0.5">UBUD</text>
        <text x="833" y="282" fontFamily="var(--font-outfit)" fontSize="9" fill="#5A4A3F" fontStyle="italic">Moon MC</text>

        <circle cx="440" cy="72" r="6" fill="#B85838" />
        <circle cx="440" cy="72" r="11" fill="none" stroke="#B85838" strokeWidth="0.8" opacity="0.6" />
        <text x="453" y="68" fontFamily="var(--font-syne)" fontWeight="700" fontSize="11" fill="#2A211B" letterSpacing="0.5">REYKJAVIK</text>
        <text x="453" y="80" fontFamily="var(--font-outfit)" fontSize="9" fill="#5A4A3F" fontStyle="italic">Saturn MC</text>

        <circle cx="478" cy="162" r="4" fill="#B85838" opacity="0.75" />
        <text x="468" y="178" textAnchor="end" fontFamily="var(--font-syne)" fontWeight="500" fontSize="9" fill="#5A4A3F">Marrakech</text>
      </g>

      <text x="990" y="248" textAnchor="end" fontFamily="var(--font-syne)" fontSize="7" fill="#5A4A3F" letterSpacing="2" opacity="0.7">EQUATOR</text>
      <text x="6" y="492" fontFamily="var(--font-syne)" fontSize="8" fill="#5A4A3F" letterSpacing="2" opacity="0.7">— THE ATLAS · PLATE II · 5 PLANETS · 20 LINES —</text>
    </svg>
  );
}

/* ============================================================
   DESTINATIONS (6 cards)
   ============================================================ */
function Destinations({ lang }: { lang: Lang }) {
  const cards: Array<{
    planet: string;
    planetEn: string;
    planetEs: string;
    color: string;
    coord: string;
    image: string;
    titleEn: string;
    titleEs: string;
    countryEn: string;
    countryEs: string;
    descEn: string;
    descEs: string;
    whenEn: string;
    whenEs: string;
  }> = [
    {
      planet: "venus",
      planetEn: "Venus Line · MC",
      planetEs: "Línea de Venus · MC",
      color: PLANET.rose,
      coord: "38.71°N · 9.14°W",
      image: PHOTOS.lisbon,
      titleEn: "Lisbon.",
      titleEs: "Lisboa.",
      countryEn: "Portugal",
      countryEs: "Portugal",
      descEn:
        "For when you have forgotten that softness is a discipline, not a weakness. Go alone. Eat slowly. Buy the ceramics.",
      descEs:
        "Para cuando has olvidado que la suavidad es una disciplina, no una debilidad. Ve sola. Come despacio. Compra las cerámicas.",
      whenEn: "May — June · September",
      whenEs: "Mayo — Junio · Septiembre",
    },
    {
      planet: "jupiter",
      planetEn: "Jupiter Line · MC",
      planetEs: "Línea de Júpiter · MC",
      color: PLANET.sageDeep,
      coord: "35.01°N · 135.76°E",
      image: PHOTOS.kyoto,
      titleEn: "Kyoto.",
      titleEs: "Kyoto.",
      countryEn: "Japan",
      countryEs: "Japón",
      descEn:
        "For when something inside you wants to be bigger but the rest of your life is still small. Walk every morning. You'll meet someone who matters.",
      descEs:
        "Para cuando algo dentro de ti quiere ser más grande pero el resto de tu vida sigue siendo pequeña. Camina cada mañana. Conocerás a alguien que importa.",
      whenEn: "April · November",
      whenEs: "Abril · Noviembre",
    },
    {
      planet: "moon",
      planetEn: "Moon × Jupiter AC",
      planetEs: "Luna × Júpiter AC",
      color: PLANET.sage,
      coord: "8.34°S · 115.09°E",
      image: PHOTOS.ubud,
      titleEn: "Ubud.",
      titleEs: "Ubud.",
      countryEn: "Bali, Indonesia",
      countryEs: "Bali, Indonesia",
      descEn:
        "For the recovery years. Not a holiday — a re-mothering. You'll sleep more than you've slept in a decade.",
      descEs:
        "Para los años de recuperación. No unas vacaciones — una re-maternidad. Dormirás más de lo que has dormido en una década.",
      whenEn: "May · September",
      whenEs: "Mayo · Septiembre",
    },
    {
      planet: "sun",
      planetEn: "Sun Line · MC",
      planetEs: "Línea del Sol · MC",
      color: PLANET.gold,
      coord: "17.06°N · 96.72°W",
      image: PHOTOS.oaxaca,
      titleEn: "Oaxaca.",
      titleEs: "Oaxaca.",
      countryEn: "Mexico",
      countryEs: "México",
      descEn:
        "For when you need to remember that you are, in fact, a person other people see. Bring a notebook. Make the painting.",
      descEs:
        "Para cuando necesitas recordar que eres, de hecho, una persona que otras personas ven. Lleva un cuaderno. Pinta el cuadro.",
      whenEn: "October — November",
      whenEs: "Octubre — Noviembre",
    },
    {
      planet: "saturn",
      planetEn: "Saturn Line · MC",
      planetEs: "Línea de Saturno · MC",
      color: PLANET.terracottaDeep,
      coord: "64.13°N · 21.94°W",
      image: PHOTOS.reykjavik,
      titleEn: "Reykjavik.",
      titleEs: "Reikiavik.",
      countryEn: "Iceland",
      countryEs: "Islandia",
      descEn:
        "For when the work has waited long enough. A line of solitude, structure, and finishing the thing you keep starting. Bring only what you can carry.",
      descEs:
        "Para cuando el trabajo ha esperado lo suficiente. Una línea de soledad, estructura, y terminar eso que sigues empezando. Trae sólo lo que puedas cargar.",
      whenEn: "June · February",
      whenEs: "Junio · Febrero",
    },
    {
      planet: "venus",
      planetEn: "Venus AC × Saturn IC",
      planetEs: "Venus AC × Saturno IC",
      color: PLANET.rose,
      coord: "31.63°N · 7.99°W",
      image: PHOTOS.marrakech,
      titleEn: "Marrakech.",
      titleEs: "Marrakech.",
      countryEn: "Morocco",
      countryEs: "Marruecos",
      descEn:
        "For when you have stopped being curious. Walk the souks without a destination. You'll hear yourself thinking again in three days.",
      descEs:
        "Para cuando has dejado de ser curiosa. Camina los zocos sin destino. Volverás a oírte pensar en tres días.",
      whenEn: "March · October",
      whenEs: "Marzo · Octubre",
    },
  ];

  return (
    <section className="px-6 md:px-12 py-20 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-[72px] items-end mb-12 md:mb-14">
        <div>
          <div
            className="font-syne"
            style={{
              fontSize: 11,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "var(--ed-rust)",
              marginBottom: 14,
            }}
          >
            <T en="Chapter Four" es="Capítulo Cuatro" lang={lang} />
          </div>
          <h2
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: "clamp(40px, 5vw, 72px)",
              lineHeight: 1,
              color: "var(--ed-ink)",
            }}
          >
            <T
              lang={lang}
              en={
                <>
                  Where to
                  <br />
                  go for…
                </>
              }
              es={
                <>
                  Adónde
                  <br />
                  ir para…
                </>
              }
            />
          </h2>
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--ed-ink-soft)",
          }}
        >
          <T
            lang={lang}
            en="Six destinations, chosen for six different seasons of your life. None of these is a 'you should.' All of them are 'if and when.' Read them slowly, and trust the ones that already feel a little obvious."
            es="Seis destinos, elegidos para seis temporadas distintas de tu vida. Ninguno es un 'deberías'. Todos son un 'si y cuando'. Léelos despacio, y confía en los que ya te parezcan un poco obvios."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-9">
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              borderTop: "1px solid var(--ed-ink)",
              paddingTop: 24,
            }}
          >
            <div
              className="font-syne flex items-center gap-2.5"
              style={{
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 18,
                color: c.color,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.color,
                }}
              />
              {lang === "en" ? c.planetEn : c.planetEs}
            </div>
            <div
              className="relative overflow-hidden group"
              style={{ aspectRatio: "4 / 3", marginBottom: 18 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.titleEn}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ filter: "saturate(1.08) contrast(1.02)" }}
              />
              <div
                className="absolute font-syne"
                style={{
                  bottom: 10,
                  right: 12,
                  fontWeight: 500,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: "rgba(250, 245, 234, 0.95)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}
              >
                {c.coord}
              </div>
            </div>
            <h4
              className="font-fraunces"
              style={{
                fontStyle: "italic",
                fontSize: 28,
                lineHeight: 1,
                color: "var(--ed-ink)",
                marginBottom: 6,
              }}
            >
              {lang === "en" ? c.titleEn : c.titleEs}
            </h4>
            <div
              className="font-syne"
              style={{
                fontSize: 11,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--ed-ink-soft)",
                marginBottom: 16,
              }}
            >
              {lang === "en" ? c.countryEn : c.countryEs}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--ed-ink-soft)",
                marginBottom: 16,
              }}
            >
              {lang === "en" ? c.descEn : c.descEs}
            </div>
            <div
              className="font-syne"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "var(--ed-ink)",
                paddingTop: 14,
                borderTop: "1px dotted var(--ed-rule)",
              }}
            >
              <T en="Best months · " es="Mejores meses · " lang={lang} />
              <span style={{ color: "var(--ed-rust)" }}>
                {lang === "en" ? c.whenEn : c.whenEs}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   PULL QUOTE
   ============================================================ */
function PullQuote({ lang }: { lang: Lang }) {
  return (
    <section
      className="text-center px-6 md:px-12 py-16 md:py-20"
      style={{
        background: "var(--ed-paper)",
        borderTop: "1px solid var(--ed-rule)",
        borderBottom: "1px solid var(--ed-rule)",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: 80,
            lineHeight: 0.5,
            color: "var(--ed-rust)",
            marginBottom: 16,
          }}
        >
          “
        </div>
        <blockquote
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(24px, 3.2vw, 42px)",
            lineHeight: 1.25,
            color: "var(--ed-ink)",
            marginBottom: 28,
          }}
        >
          <T
            lang={lang}
            en={
              <>
                A place doesn&rsquo;t change who you are. It changes which
                version of you
                <br />
                gets the most light that week.
              </>
            }
            es={
              <>
                Un lugar no cambia quién eres. Cambia qué versión de ti
                <br />
                recibe más luz esa semana.
              </>
            }
          />
        </blockquote>
        <div
          className="font-syne"
          style={{
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--ed-ink-soft)",
          }}
        >
          <T
            en="— From the closing note · Page 28"
            es="— De la nota final · Página 28"
            lang={lang}
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CLOSING CTA
   ============================================================ */
function Closing({
  lang,
  calendlyUrl,
}: {
  lang: Lang;
  calendlyUrl: string;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-[80px] items-center px-6 md:px-12 py-20 md:py-24">
      <div>
        <div
          className="font-syne"
          style={{
            fontSize: 11,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: "var(--ed-rust)",
            marginBottom: 18,
          }}
        >
          <T en="Commission yours" es="Encarga la tuya" lang={lang} />
        </div>
        <h2
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(40px, 5vw, 68px)",
            lineHeight: 1,
            color: "var(--ed-ink)",
            marginBottom: 24,
          }}
        >
          <T
            lang={lang}
            en={
              <>
                Your own,
                <br />
                made for you.
              </>
            }
            es={
              <>
                La tuya,
                <br />
                hecha para ti.
              </>
            }
          />
        </h2>
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: "var(--ed-ink-soft)",
            marginBottom: 28,
          }}
        >
          <p style={{ marginBottom: 14 }}>
            <T
              lang={lang}
              en="Every Soul Guided Travel Magazine is built individually around your birth chart. Once you book, I'll send a short form for your birth data, ask about the season of life you're in, and write your edition by hand over the following ten days."
              es="Cada revista de Viaje Guiado del Alma se construye individualmente alrededor de tu carta natal. Una vez reservada, te enviaré un formulario corto para tus datos de nacimiento, te preguntaré sobre la temporada de vida en la que estás, y escribiré tu edición a mano durante los siguientes diez días."
            />
          </p>
          <p>
            <T
              lang={lang}
              en="It arrives as a printable PDF and a private digital reader. You can keep it for the next ten years."
              es="Llega como un PDF imprimible y un lector digital privado. Puedes guardarlo durante los próximos diez años."
            />
          </p>
        </div>
        <div
          className="flex items-baseline gap-5 mb-8 pb-6 flex-wrap"
          style={{ borderBottom: "1px solid var(--ed-rule)" }}
        >
          <div
            className="font-fraunces"
            style={{
              fontStyle: "italic",
              fontSize: 52,
              color: "var(--ed-rust)",
              lineHeight: 1,
            }}
          >
            €75
          </div>
          <div
            className="font-syne"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--ed-ink-soft)",
              lineHeight: 1.7,
            }}
          >
            <T
              lang={lang}
              en={
                <>
                  One-time
                  <br />
                  10-day turnaround
                </>
              }
              es={
                <>
                  Pago único
                  <br />
                  Entrega en 10 días
                </>
              }
            />
          </div>
        </div>
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-syne inline-block"
          style={{
            background: "var(--ed-rust)",
            color: "var(--ed-paper)",
            padding: "20px 44px",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          <T en="Commission Yours" es="Encarga la Tuya" lang={lang} />{" "}
          <span
            className="font-fraunces"
            style={{ fontStyle: "italic", marginLeft: 8 }}
          >
            →
          </span>
        </a>
      </div>

      <div
        className="relative"
        style={{
          background: "var(--ed-paper)",
          padding: "36px 32px",
          border: "1px solid var(--ed-rule)",
        }}
      >
        <div
          className="font-syne"
          style={{
            position: "absolute",
            top: -14,
            right: 24,
            background: "var(--ed-paper-deep)",
            padding: "4px 12px",
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ed-rust)",
          }}
        >
          <T en="What's Inside" es="Qué Incluye" lang={lang} />
        </div>
        <h4
          className="font-fraunces"
          style={{
            fontStyle: "italic",
            fontSize: 26,
            color: "var(--ed-ink)",
            marginBottom: 24,
          }}
        >
          <T
            en="Each edition contains:"
            es="Cada edición incluye:"
            lang={lang}
          />
        </h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            {
              en: "A personal letter from Gabriela, written to you specifically",
              es: "Una carta personal de Gabriela, escrita específicamente para ti",
            },
            {
              en: "A full-spread Atlas of your five astrocartography lines",
              es: "Un Atlas a doble página de tus cinco líneas de astrocartografía",
            },
            {
              en: "Six destinations chosen for your chart — with the best months for each",
              es: "Seis destinos elegidos para tu carta — con los mejores meses para cada uno",
            },
            {
              en: "One featured location, written as a long-form essay",
              es: "Una ubicación destacada, escrita como ensayo largo",
            },
            {
              en: "An almanac of rituals — one per place, optional, never prescriptive",
              es: "Un almanaque de rituales — uno por lugar, opcionales, nunca prescriptivos",
            },
            {
              en: "A closing chapter on returning home with what you found",
              es: "Un capítulo final sobre volver a casa con lo que encontraste",
            },
          ].map((item, i, arr) => (
            <li
              key={i}
              className="flex items-start gap-3.5"
              style={{
                padding: "14px 0",
                borderBottom:
                  i < arr.length - 1
                    ? "1px dotted var(--ed-rule)"
                    : "none",
                fontSize: 14,
                color: "var(--ed-ink-soft)",
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  color: "var(--ed-rust)",
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                ◆
              </span>
              <span>{lang === "en" ? item.en : item.es}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer
      className="flex justify-between items-center flex-wrap gap-4 px-6 md:px-12 py-7"
      style={{
        borderTop: "1px solid var(--ed-rule)",
        fontSize: 10,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "var(--ed-ink-soft)",
      }}
    >
      <div
        className="font-syne"
        style={{ color: "var(--ed-rust)", fontWeight: 700 }}
      >
        The Astro Psyche Lab
      </div>
      <div className="font-syne">Barcelona · @astropsychelab</div>
      <div className="font-syne">Issue No. 01 · Spring MMXXVI</div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.05em",
          textTransform: "none",
          color: "var(--ed-ink-soft)",
          opacity: 0.6,
          maxWidth: 360,
          lineHeight: 1.5,
        }}
      >
        Photography: Unsplash &amp; Pexels — João Ferrão (Lisbon cover), Farnaz
        Kohankhaki (Lisbon tiles), Bapak Moto (Kyoto), Radoslav Bali (Ubud),
        Roman Lopez (Oaxaca), Marek Piwnicki (Reykjavik). All used under
        Unsplash &amp; Pexels licenses.
      </div>
    </footer>
  );
}
