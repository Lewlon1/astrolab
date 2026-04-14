"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import type { Service } from "@/types";

const FALLBACK_CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

type CardCopy = {
  slug: string;
  image: string;
  theme: string;
  fallbackName: string;
  fallbackPrice: number;
  cardName: { en: string; es: string };
  tier: { en: string; es: string };
  essence: { en: string; es: string };
  features: { en: string; es: string }[];
  book: { en: string; es: string };
};

const CARDS: CardCopy[] = [
  {
    slug: "cosmic-quick-hit",
    image: "/images/The_fool.JPG",
    theme: "tc-fool",
    fallbackName: "Cosmic Quick Hit",
    fallbackPrice: 25,
    cardName: { en: "The Fool", es: "El Loco" },
    tier: {
      en: "Entry Point · The Leap",
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
  },
  {
    slug: "astro-psyche-blend",
    image: "/images/The_sun.JPG",
    theme: "tc-sun",
    fallbackName: "Astro Psyche Blend",
    fallbackPrice: 65,
    cardName: { en: "The Sun", es: "El Sol" },
    tier: {
      en: "Foundation · Self-Awareness",
      es: "Base · Autoconocimiento",
    },
    essence: {
      en: "This is where you meet yourself. Your foundation. Your clarity. Your starting point.",
      es: "Aquí es donde te encuentras contigo misma. Tu base. Tu claridad. Tu punto de partida.",
    },
    features: [
      {
        en: "Full natal chart illuminated",
        es: "Carta natal completa iluminada",
      },
      { en: "Core personality patterns", es: "Patrones de personalidad" },
      {
        en: "Shadow work foundations",
        es: "Bases del trabajo de sombra",
      },
      { en: "60-minute session", es: "Sesión de 60 minutos" },
    ],
    book: { en: "Book Session", es: "Reservar" },
  },
  {
    slug: "stellar-insights",
    image: "/images/The_star.jpg",
    theme: "tc-star",
    fallbackName: "Stellar Insights",
    fallbackPrice: 120,
    cardName: { en: "The Star", es: "La Estrella" },
    tier: {
      en: "Guidance · Deep Understanding",
      es: "Guía · Comprensión Profunda",
    },
    essence: {
      en: "This is where things start making sense. Your patterns connect. Your path becomes clearer.",
      es: "Aquí es donde todo empieza a tener sentido. Tus patrones se conectan. Tu camino se aclara.",
    },
    features: [
      {
        en: "The \u201cwhy\u201d behind your patterns",
        es: "El \u201cporqué\u201d de tus patrones",
      },
      {
        en: "Career + purpose deep-dive",
        es: "Inmersión en carrera + propósito",
      },
      {
        en: "Psychological pattern work",
        es: "Trabajo de patrones psicológicos",
      },
      { en: "90-minute session", es: "Sesión de 90 minutos" },
    ],
    book: { en: "Book Session", es: "Reservar" },
  },
  {
    slug: "cosmic-alliance",
    image: "/images/The_empress.JPG",
    theme: "tc-empress",
    fallbackName: "Cosmic Alliance",
    fallbackPrice: 180,
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
  },
  {
    slug: "soul-guided-travel-magazine",
    image: "/images/The_wheel_of_fortune.JPG",
    theme: "tc-wheel",
    fallbackName: "Soul Guided Travel Magazine",
    fallbackPrice: 75,
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
        es: "Actividades por tránsitos",
      },
      { en: "Optimal timing for each trip", es: "Timing óptimo por viaje" },
      { en: "Digital PDF · 5-day delivery", es: "PDF digital · entrega en 5 días" },
    ],
    book: { en: "Order Magazine", es: "Pedir Revista" },
  },
];

type Props = {
  services: Service[];
};

export default function TarotDeck({ services }: Props) {
  const { lang } = useLang();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="tarot-section" id="tarot">
      <p className="section-eyebrow">
        {lang === "en" ? "Choose Your Path" : "Elige Tu Camino"}
      </p>
      <h2 className="section-title">
        {lang === "en" ? "What's calling you?" : "¿Qué te está llamando?"}
      </h2>
      <p className="section-sub">
        {lang === "en"
          ? "Each card holds a session. Tap to reveal the reading that matches where you are right now."
          : "Cada carta contiene una sesión. Toca para revelar la lectura que conecta con donde estás ahora."}
      </p>

      <div className="tarot-deck">
        {CARDS.map((card, idx) => {
          const svc = services.find((s) => s.slug === card.slug);
          const name = svc?.name ?? card.fallbackName;
          const price = svc?.price ?? card.fallbackPrice;
          const calendly = svc?.calendly_url ?? FALLBACK_CALENDLY;
          const isFlipped = !!flipped[idx];

          return (
            <div
              key={card.slug}
              className={`tarot-card ${card.theme} reveal visible${
                isFlipped ? " flipped" : ""
              }`}
              onClick={() => toggleCard(idx)}
              role="button"
              tabIndex={0}
              aria-label={`${name} — ${lang === "en" ? "tap to reveal" : "toca para revelar"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleCard(idx);
                }
              }}
            >
              <div className="tarot-card-inner">
                {/* Front */}
                <div className="tarot-face tarot-front">
                  <Image
                    src={card.image}
                    alt={card.cardName[lang]}
                    fill
                    sizes="(max-width: 768px) 48vw, 195px"
                    style={{ objectFit: "cover" }}
                  />
                  <div className="tf-overlay">
                    <div className="tf-name">{card.cardName[lang]}</div>
                    <div className="tf-tap">
                      {lang === "en" ? "tap to reveal" : "toca para revelar"}
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div className="tarot-face tarot-back">
                  <span className="tb-tier">{card.tier[lang]}</span>
                  <h4 className="tb-name">{name}</h4>
                  <p className="tb-price">€{price}</p>
                  <p className="tb-essence">{card.essence[lang]}</p>
                  <ul className="tb-features">
                    {card.features.map((f, fi) => (
                      <li key={fi}>{f[lang]}</li>
                    ))}
                  </ul>
                  <a
                    href={calendly}
                    className="tb-book"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {card.book[lang]}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="tarot-hint">
        {lang === "en"
          ? "Tap each card to reveal your session"
          : "Toca cada carta para revelar tu sesión"}
      </p>
    </section>
  );
}
