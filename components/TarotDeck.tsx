"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import LangText from "@/components/LangText";
import type { Service } from "@/types";

const FALLBACK_CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

type Bilingual = { en: string; es: string };

type CardCopy = {
  slug: string;
  image: string;
  fallbackName: string;
  fallbackPrice: number;
  fallbackDuration: Bilingual;
  cardName: Bilingual;
  tier: Bilingual;
  essence: Bilingual;
  features: Bilingual[];
  book: Bilingual;
  spreadRole: Bilingual;
};

const CARDS: CardCopy[] = [
  {
    slug: "cosmic-quick-hit",
    image: "/images/The_fool.JPG",
    fallbackName: "Cosmic Quick Hit",
    fallbackPrice: 25,
    fallbackDuration: { en: "48hr async", es: "48h asíncrono" },
    cardName: { en: "The Fool", es: "El Loco" },
    tier: {
      en: "Entry · The Leap",
      es: "Punto de Entrada · El Salto",
    },
    essence: {
      en: "You don't need to have it all figured out. Just start.",
      es: "No necesitas tenerlo todo claro. Solo empieza.",
    },
    features: [
      {
        en: "Personalised voice note insight",
        es: "Nota de voz personalizada",
      },
      { en: "Key chart pattern revealed", es: "Patrón clave de tu carta" },
      { en: "Your next step, clarified", es: "Tu próximo paso, clarificado" },
      { en: "Async · delivered in 48hrs", es: "Asíncrono · entrega en 48h" },
    ],
    book: { en: "Start Here", es: "Empieza Aquí" },
    spreadRole: { en: "Past", es: "Pasado" },
  },
  {
    slug: "astro-psyche-blend",
    image: "/images/The_sun.JPG",
    fallbackName: "Astro Psyche Blend",
    fallbackPrice: 65,
    fallbackDuration: { en: "60 min", es: "60 min" },
    cardName: { en: "The Sun", es: "El Sol" },
    tier: {
      en: "Foundation · Self-Awareness",
      es: "Base · Autoconocimiento",
    },
    essence: {
      en: "Where you meet yourself. Your foundation. Your clarity.",
      es: "Aquí es donde te encuentras contigo misma. Tu base. Tu claridad.",
    },
    features: [
      {
        en: "Full natal chart illuminated",
        es: "Carta natal completa iluminada",
      },
      { en: "Core personality patterns", es: "Patrones de personalidad" },
      { en: "Shadow work foundations", es: "Bases del trabajo de sombra" },
      { en: "60-minute live session", es: "Sesión en vivo de 60 minutos" },
    ],
    book: { en: "Book Session", es: "Reservar" },
    spreadRole: { en: "Approach", es: "Enfoque" },
  },
  {
    slug: "stellar-insights",
    image: "/images/The_star.jpg",
    fallbackName: "Stellar Insights",
    fallbackPrice: 120,
    fallbackDuration: { en: "90 min", es: "90 min" },
    cardName: { en: "The Star", es: "La Estrella" },
    tier: {
      en: "Guidance · Deep Understanding",
      es: "Guía · Comprensión Profunda",
    },
    essence: {
      en: "Where things start making sense. Your patterns connect.",
      es: "Aquí es donde todo empieza a tener sentido. Tus patrones se conectan.",
    },
    features: [
      {
        en: "The “why” behind your patterns",
        es: "El “porqué” de tus patrones",
      },
      {
        en: "Career + purpose deep-dive",
        es: "Inmersión en carrera + propósito",
      },
      {
        en: "Psychological pattern work",
        es: "Trabajo de patrones psicológicos",
      },
      { en: "90-minute live session", es: "Sesión en vivo de 90 minutos" },
    ],
    book: { en: "Book Session", es: "Reservar" },
    spreadRole: { en: "Present", es: "Presente" },
  },
  {
    slug: "cosmic-alliance",
    image: "/images/The_empress.JPG",
    fallbackName: "Cosmic Alliance",
    fallbackPrice: 180,
    fallbackDuration: { en: "120 min + follow-up", es: "120 min + seguimiento" },
    cardName: { en: "The Empress", es: "La Emperatriz" },
    tier: {
      en: "Full Integration · Creation",
      es: "Integración Total · Creación",
    },
    essence: {
      en: "You don't just understand yourself — you start building your life aligned with it.",
      es: "No solo te entiendes — empiezas a construir tu vida alineada con ello.",
    },
    features: [
      {
        en: "Everything in Stellar Insights",
        es: "Todo lo de Stellar Insights",
      },
      { en: "Astrocartography mapping", es: "Mapa astrocartográfico" },
      {
        en: "Full life integration roadmap",
        es: "Hoja de ruta de vida integrada",
      },
      { en: "120 min + follow-up", es: "120 min + seguimiento" },
    ],
    book: { en: "Book Session", es: "Reservar" },
    spreadRole: { en: "Path", es: "Camino" },
  },
  {
    slug: "soul-guided-travel-magazine",
    image: "/images/The_wheel_of_fortune.JPG",
    fallbackName: "Soul Guided Travel Magazine",
    fallbackPrice: 75,
    fallbackDuration: { en: "PDF · 5 days", es: "PDF · 5 días" },
    cardName: { en: "Wheel of Fortune", es: "La Rueda" },
    tier: {
      en: "Destiny · Travel · Timing",
      es: "Destino · Viajes · Timing",
    },
    essence: {
      en: "Align with the right places, at the right time, for the right version of your life.",
      es: "Alinéate con los lugares correctos, en el momento correcto, para la versión correcta de tu vida.",
    },
    features: [
      {
        en: "Top 5 destinations from your chart",
        es: "Top 5 destinos de tu carta",
      },
      {
        en: "Activities aligned to your transits",
        es: "Actividades por tus tránsitos",
      },
      { en: "Optimal timing for each trip", es: "Timing óptimo por viaje" },
      {
        en: "Digital PDF · 5-day delivery",
        es: "PDF digital · entrega en 5 días",
      },
    ],
    book: { en: "Order Magazine", es: "Pedir Revista" },
    spreadRole: { en: "Future", es: "Futuro" },
  },
];

const LIFT = [40, 20, 0, 20, 40];

type Props = {
  services: Service[];
};

export default function TarotDeck({ services }: Props) {
  const { lang } = useLang();
  const [activeCard, setActiveCard] = useState<number | null>(2); // middle = "The Star" default-flipped per prototype

  return (
    <section
      id="tarot"
      className="px-6 md:px-14 py-20 md:py-[120px]"
      style={{
        background: "var(--ed-paper-deep)",
        borderBottom: "1px solid var(--ed-rule)",
      }}
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
            Pp. 12
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
            <LangText en="The Spread" es="La Tirada" />
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="font-fraunces m-0 mb-4"
            style={{
              fontSize: "clamp(40px, 7vw, 88px)",
              fontWeight: 300,
              color: "var(--ed-ink)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            <LangText
              en={
                <>
                  What&apos;s{" "}
                  <em
                    style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                  >
                    calling
                  </em>{" "}
                  you?
                </>
              }
              es={
                <>
                  ¿Qué te está{" "}
                  <em
                    style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                  >
                    llamando
                  </em>
                  ?
                </>
              }
            />
          </h2>
          <p
            className="font-spectral mx-auto"
            style={{
              fontSize: 17,
              color: "var(--ed-ink-soft)",
              maxWidth: 540,
              lineHeight: 1.65,
              margin: "0 auto",
            }}
          >
            <LangText
              en="Five sessions, laid as a reading. Select a card to see what it holds."
              es="Cinco sesiones, dispuestas como una lectura. Selecciona una carta para ver lo que guarda."
            />
          </p>
        </div>

        {/* Spread */}
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5 max-w-[1180px] mx-auto items-end ed-perspective"
        >
          {CARDS.map((card, i) => {
            const svc = services.find((s) => s.slug === card.slug);
            const name = svc?.name ?? card.fallbackName;
            const price = svc?.price ?? card.fallbackPrice;
            const calendly = svc?.calendly_url ?? FALLBACK_CALENDLY;
            const isFlipped = activeCard === i;

            return (
              <CardSlot
                key={card.slug}
                card={card}
                index={i}
                name={name}
                price={price}
                calendly={calendly}
                duration={card.fallbackDuration[lang]}
                isFlipped={isFlipped}
                lang={lang}
                onToggle={() => setActiveCard(isFlipped ? null : i)}
                desktopLift={LIFT[i]}
              />
            );
          })}
        </div>

        {/* Detail panel */}
        {activeCard !== null && (
          <div
            className="mt-12 md:mt-16 px-6 md:px-14 py-10 md:py-12 max-w-[1100px] mx-auto"
            style={{
              background: "var(--ed-paper)",
              border: "1px solid var(--ed-ink)",
            }}
          >
            <ServiceDetail
              card={CARDS[activeCard]}
              service={services.find(
                (s) => s.slug === CARDS[activeCard].slug,
              )}
              lang={lang}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Single card slot ---------- */

type CardSlotProps = {
  card: CardCopy;
  index: number;
  name: string;
  price: number | null;
  calendly: string;
  duration: string;
  isFlipped: boolean;
  lang: "en" | "es";
  onToggle: () => void;
  desktopLift: number;
};

function CardSlot({
  card,
  index,
  name,
  price,
  calendly,
  duration,
  isFlipped,
  lang,
  onToggle,
  desktopLift,
}: CardSlotProps) {
  return (
    <div>
      {/* Desktop-only horseshoe lift spacer */}
      <div
        className="hidden md:block"
        aria-hidden
        style={{ height: desktopLift }}
      />
      <div
        onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-label={`${card.cardName[lang]} — ${
            lang === "en" ? "tap to reveal" : "toca para revelar"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          className="relative cursor-pointer ed-3d"
          style={{
            width: "100%",
            aspectRatio: "3 / 5",
            transition: "transform .8s cubic-bezier(.4,.05,.2,1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 overflow-hidden ed-backface-hidden"
            style={{
              border: "1px solid rgba(26,24,20,0.25)",
              background: "var(--ed-ink)",
              boxShadow: "0 4px 14px rgba(0,0,0,.08)",
            }}
          >
            <Image
              src={card.image}
              alt={card.cardName[lang]}
              fill
              sizes="(max-width: 768px) 48vw, 220px"
              style={{ objectFit: "cover" }}
            />
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,.85))",
                padding: "20px 14px 14px",
              }}
            >
              <div
                className="font-dm-mono mb-1"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: "var(--ed-ochre)",
                }}
              >
                {String(index + 1).padStart(2, "0")} / 05
              </div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "#fff",
                }}
              >
                {card.cardName[lang]}
              </div>
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 ed-backface-hidden flex flex-col"
            style={{
              transform: "rotateY(180deg)",
              background: "var(--ed-paper)",
              border: "1.5px solid var(--ed-rust)",
              padding: "16px 14px 14px",
              boxShadow: "0 20px 50px rgba(0,0,0,.18)",
            }}
          >
            <div
              className="font-dm-mono uppercase mb-1.5"
              style={{
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "var(--ed-rust)",
              }}
            >
              {card.tier[lang]}
            </div>
            <div
              className="font-fraunces"
              style={{
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--ed-ink)",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {card.cardName[lang]}
            </div>
            <div
              className="font-fraunces mb-2.5"
              style={{
                fontSize: 12,
                color: "var(--ed-ink-soft)",
              }}
            >
              {name}
            </div>
            <div
              className="font-fraunces"
              style={{
                fontSize: 24,
                color: "var(--ed-rust)",
                marginBottom: 2,
                fontWeight: 400,
                lineHeight: 1,
              }}
            >
              €{price ?? card.fallbackPrice}
            </div>
            <div
              className="font-dm-mono uppercase mb-3"
              style={{
                fontSize: 8,
                letterSpacing: "0.15em",
                color: "var(--ed-text-mute)",
              }}
            >
              {duration}
            </div>
            <p
              className="font-fraunces flex-1 m-0 mb-3"
              style={{
                fontStyle: "italic",
                fontSize: 11,
                color: "var(--ed-ink)",
                lineHeight: 1.4,
              }}
            >
              &ldquo;{card.essence[lang]}&rdquo;
            </p>
            <a
              href={calendly}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block text-center font-dm-mono uppercase mb-1.5"
              style={{
                background: "var(--ed-ink)",
                color: "var(--ed-paper)",
                padding: "10px 8px",
                fontSize: 9,
                letterSpacing: "0.2em",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {card.book[lang]} →
            </a>
            <div
              className="text-center font-dm-mono uppercase"
              style={{
                fontSize: 8,
                color: "var(--ed-text-mute)",
                letterSpacing: "0.15em",
              }}
            >
              {lang === "en" ? "Tap to flip back" : "Toca para volver"}
            </div>
          </div>
        </div>

    </div>
  );
}

/* ---------- Detail panel ---------- */

type ServiceDetailProps = {
  card: CardCopy;
  service: Service | undefined;
  lang: "en" | "es";
};

function ServiceDetail({ card, service, lang }: ServiceDetailProps) {
  const name = service?.name ?? card.fallbackName;
  const price = service?.price ?? card.fallbackPrice;
  const calendly = service?.calendly_url ?? FALLBACK_CALENDLY;
  const duration = card.fallbackDuration[lang];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 md:gap-14 items-start">
      <div>
        <div
          className="font-dm-mono uppercase mb-3"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--ed-rust)",
          }}
        >
          {card.tier[lang]}
        </div>
        <h3
          className="font-fraunces m-0 mb-4"
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 300,
            color: "var(--ed-ink)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {card.cardName[lang]}
          <br />
          <em
            style={{
              fontStyle: "italic",
              fontSize: "clamp(20px, 3vw, 28px)",
              color: "var(--ed-text-mute)",
            }}
          >
            {name}
          </em>
        </h3>
        <div
          className="font-fraunces mb-2"
          style={{
            fontSize: 38,
            color: "var(--ed-rust)",
            fontWeight: 400,
          }}
        >
          €{price}
        </div>
        <div
          className="font-dm-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "var(--ed-text-mute)",
          }}
        >
          {duration}
        </div>
      </div>
      <div>
        <p
          className="font-fraunces m-0 mb-7"
          style={{
            fontStyle: "italic",
            fontSize: "clamp(18px, 2vw, 24px)",
            fontWeight: 300,
            color: "var(--ed-ink)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
          }}
        >
          &ldquo;{card.essence[lang]}&rdquo;
        </p>
        <div
          className="pt-5"
          style={{ borderTop: "1px solid var(--ed-ink)" }}
        >
          {card.features.map((f, i) => (
            <div
              key={i}
              className="grid grid-cols-[40px_1fr] gap-4 py-3"
              style={{
                borderBottom:
                  i < card.features.length - 1
                    ? "1px solid var(--ed-rule)"
                    : "none",
              }}
            >
              <span
                className="font-dm-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--ed-text-mute)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="font-spectral"
                style={{
                  fontSize: 15,
                  color: "var(--ed-ink-soft)",
                }}
              >
                {f[lang]}
              </span>
            </div>
          ))}
        </div>
        <a
          href={calendly}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-dm-mono uppercase mt-6"
          style={{
            background: "var(--ed-ink)",
            color: "var(--ed-paper)",
            padding: "14px 28px",
            fontSize: 11,
            letterSpacing: "0.22em",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {card.book[lang]} →
        </a>
      </div>
    </div>
  );
}
