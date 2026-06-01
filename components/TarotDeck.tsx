"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import LangText from "@/components/LangText";
import BookAction from "@/components/booking/BookAction";
import { bookingForSlug } from "@/lib/booking";
import { track } from "@/lib/analytics/track";
import type { Service } from "@/types";

type Bilingual = { en: string; es: string };

type CardCopy = {
  slug: string;
  image: string;
  fallbackName: string;
  fallbackPrice: number;
  fallbackDuration: Bilingual;
  cardName: Bilingual;
  emoji: string;
  tier: Bilingual;
  hook: Bilingual;
  lead: Bilingual;
  offering: Bilingual;
  closing: Bilingual;
  bullets?: { intro?: Bilingual; items: Bilingual[] };
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
    emoji: "✨",
    tier: {
      en: "Entry · The Leap",
      es: "Punto de Entrada · El Salto",
    },
    hook: {
      en: "Standing at the edge of a new chapter — trust the path.",
      es: "De pie ante un nuevo capítulo — confía en el camino.",
    },
    lead: {
      en: "Like The Fool, you may be standing at the edge of a new chapter — being asked to trust a path that hasn't fully revealed itself yet.\n\nAnd although The Fool may seem impulsive, what truly guides them is faith: the deep inner knowing that the next step will appear once they begin moving.",
      es: "Como El Loco, puedes estar de pie ante el borde de un nuevo capítulo — invitada a confiar en un camino que aún no se ha revelado por completo.\n\nY aunque El Loco pueda parecer impulsivo, lo que realmente le guía es la fe: el conocimiento profundo de que el siguiente paso aparecerá en cuanto empieces a moverte.",
    },
    offering: {
      en: "If this card resonates with you, the Cosmic Quick Hit is your invitation. A brief but intentional reading designed to bring clarity to your current question, reconnect you with your intuition, and offer the message you most need to hear right now.",
      es: "Si esta carta resuena contigo, el Cosmic Quick Hit es tu invitación. Una lectura breve pero intencional, diseñada para traer claridad a tu pregunta actual, reconectarte con tu intuición y ofrecerte el mensaje que más necesitas escuchar ahora mismo.",
    },
    closing: {
      en: "Consider it your first step into the Lab — a small leap of faith toward deeper self-understanding.",
      es: "Considéralo tu primer paso en el Lab — un pequeño salto de fe hacia un autoconocimiento más profundo.",
    },
    spreadRole: { en: "Past", es: "Pasado" },
  },
  {
    slug: "astro-psyche-blend",
    image: "/images/The_sun.JPG",
    fallbackName: "Astro Psyche Blend",
    fallbackPrice: 65,
    fallbackDuration: { en: "60 min", es: "60 min" },
    cardName: { en: "The Sun", es: "El Sol" },
    emoji: "☀️",
    tier: {
      en: "Foundation · Self-Awareness",
      es: "Base · Autoconocimiento",
    },
    hook: {
      en: "Ready to understand yourself more clearly.",
      es: "Lista para entenderte con más claridad.",
    },
    lead: {
      en: "The Sun appears when you're ready to understand yourself more clearly. This card represents self-awareness, illumination, and the beginning of a deeper connection with who you truly are beneath the noise of everyday life.",
      es: "El Sol aparece cuando estás lista para entenderte con más claridad. Esta carta representa el autoconocimiento, la iluminación y el comienzo de una conexión más profunda con quien realmente eres bajo el ruido del día a día.",
    },
    offering: {
      en: "If this card resonates with you, the Astro Psyche Blend is the perfect place to begin. Designed for those who are newer to astrology or just beginning to explore their birth chart, this reading offers an accessible but meaningful introduction to your cosmic blueprint — helping you understand your core energies, emotional patterns, strengths, and inner motivations through both astrology and psychology.",
      es: "Si esta carta resuena contigo, el Astro Psyche Blend es el lugar perfecto para empezar. Pensado para quienes son nuevas en la astrología o están empezando a explorar su carta natal, esta lectura ofrece una introducción accesible pero significativa a tu mapa cósmico — ayudándote a comprender tus energías centrales, patrones emocionales, fortalezas y motivaciones internas a través de la astrología y la psicología.",
    },
    closing: {
      en: "A warm first step into the Lab: insightful, grounding, and deeply personal.",
      es: "Un primer paso cálido al Lab: revelador, asentador y profundamente personal.",
    },
    spreadRole: { en: "Approach", es: "Enfoque" },
  },
  {
    slug: "stellar-insights",
    image: "/images/The_star.jpg",
    fallbackName: "Stellar Insights",
    fallbackPrice: 120,
    fallbackDuration: { en: "90 min", es: "90 min" },
    cardName: { en: "The Star", es: "La Estrella" },
    emoji: "✨",
    tier: {
      en: "Guidance · Deep Understanding",
      es: "Guía · Comprensión Profunda",
    },
    hook: {
      en: "Ready to go deeper into your chart.",
      es: "Lista para ir más profundo en tu carta.",
    },
    lead: {
      en: "The Star arrives when you're ready to go deeper. After the first layers of self-discovery, this card invites you into greater alignment — the kind that comes from truly understanding the deeper patterns, cycles, and purpose woven into your chart.",
      es: "La Estrella llega cuando estás lista para ir más profundo. Después de las primeras capas del autoconocimiento, esta carta te invita a una mayor alineación — la que viene de comprender de verdad los patrones, ciclos y propósitos tejidos en tu carta.",
    },
    offering: {
      en: "If you already have some familiarity with astrology, or have previously experienced the Astro Psyche Blend, Stellar Insights expands the conversation. This reading explores your chart with greater depth and nuance, uncovering the energetic themes, soul lessons, emotional dynamics, and cosmic timing influencing your path right now.",
      es: "Si ya tienes cierta familiaridad con la astrología, o has experimentado antes el Astro Psyche Blend, Stellar Insights expande la conversación. Esta lectura explora tu carta con mayor profundidad y matiz, descubriendo los temas energéticos, lecciones del alma, dinámicas emocionales y el timing cósmico que influyen en tu camino ahora mismo.",
    },
    closing: {
      en: "For those ready to move beyond “who am I?” and into “who am I becoming?”",
      es: "Para quienes están listas para ir más allá de “¿quién soy?” y entrar en “¿en quién me estoy convirtiendo?”",
    },
    spreadRole: { en: "Present", es: "Presente" },
  },
  {
    slug: "cosmic-alliance",
    image: "/images/The_empress.JPG",
    fallbackName: "Cosmic Alliance",
    fallbackPrice: 180,
    fallbackDuration: { en: "120 min + follow-up", es: "120 min + seguimiento" },
    cardName: { en: "The Empress", es: "La Emperatriz" },
    emoji: "🌿",
    tier: {
      en: "Full Integration · Creation",
      es: "Integración Total · Creación",
    },
    hook: {
      en: "Relationships are ecosystems.",
      es: "Las relaciones son ecosistemas.",
    },
    lead: {
      en: "The Empress teaches us that relationships are ecosystems. They nourish us, challenge us, mirror us, and often awaken parts of ourselves we could never reach alone.",
      es: "La Emperatriz nos enseña que las relaciones son ecosistemas. Nos nutren, nos retan, nos espejan y, a menudo, despiertan partes de nosotras a las que no podríamos llegar solas.",
    },
    offering: {
      en: "If this card resonates with you, Cosmic Alliance is an advanced synastry experience designed for those seeking a profound understanding of connection through astrology. This is not a surface-level compatibility reading — it is an in-depth exploration of the energetic, emotional, psychological, and karmic dynamics between two individuals.",
      es: "Si esta carta resuena contigo, Cosmic Alliance es una experiencia avanzada de sinastría diseñada para quienes buscan una comprensión profunda de la conexión a través de la astrología. No es una lectura de compatibilidad superficial — es una exploración profunda de las dinámicas energéticas, emocionales, psicológicas y kármicas entre dos personas.",
    },
    bullets: {
      intro: {
        en: "Through the interplay of both charts, we uncover:",
        es: "A través del juego entre ambas cartas, descubrimos:",
      },
      items: [
        { en: "relationship patterns", es: "patrones de relación" },
        { en: "emotional needs", es: "necesidades emocionales" },
        { en: "attraction dynamics", es: "dinámicas de atracción" },
        { en: "growth points", es: "puntos de crecimiento" },
        { en: "soul contracts", es: "contratos del alma" },
        {
          en: "the deeper purpose behind the connection itself",
          es: "el propósito más profundo detrás de la conexión misma",
        },
      ],
    },
    closing: {
      en: "A layered and immersive experience for those ready to understand love, intimacy, and partnership beyond chemistry alone.",
      es: "Una experiencia inmersiva y por capas para quienes están listas para entender el amor, la intimidad y la pareja más allá de la química.",
    },
    spreadRole: { en: "Path", es: "Camino" },
  },
  {
    slug: "soul-guided-travel-magazine",
    image: "/images/The_wheel_of_fortune.JPG",
    fallbackName: "Soul Guided Travel Magazine",
    fallbackPrice: 75,
    fallbackDuration: { en: "PDF · 5 days", es: "PDF · 5 días" },
    cardName: { en: "Wheel of Fortune", es: "La Rueda" },
    emoji: "🌍",
    tier: {
      en: "Destiny · Travel · Timing",
      es: "Destino · Viajes · Timing",
    },
    hook: {
      en: "Life shifts when we move with alignment.",
      es: "La vida cambia cuando te mueves con alineación.",
    },
    lead: {
      en: "The Wheel of Fortune reminds us that life shifts when we move with alignment instead of resistance. Certain places awaken certain versions of us — some cities expand our ambition, others soften us into love, creativity, healing, or reinvention.",
      es: "La Rueda de la Fortuna nos recuerda que la vida cambia cuando nos movemos con alineación en lugar de resistencia. Ciertos lugares despiertan ciertas versiones de nosotras — algunas ciudades expanden nuestra ambición, otras nos suavizan hacia el amor, la creatividad, la sanación o la reinvención.",
    },
    offering: {
      en: "If this card resonates with you, the Soul Guided Travel Magazine is your invitation to explore how the world interacts with your birth chart. This personalized experience blends astrology, storytelling, and astrocartography to reveal the locations that energetically support different areas of your life, including:",
      es: "Si esta carta resuena contigo, el Soul Guided Travel Magazine es tu invitación a explorar cómo el mundo interactúa con tu carta natal. Esta experiencia personalizada combina astrología, narrativa y astrocartografía para revelar las ubicaciones que sostienen energéticamente diferentes áreas de tu vida, incluyendo:",
    },
    bullets: {
      items: [
        { en: "Love & relationships", es: "Amor y relaciones" },
        { en: "Career & visibility", es: "Carrera y visibilidad" },
        { en: "Creativity & inspiration", es: "Creatividad e inspiración" },
        {
          en: "Rest, healing & nervous system reset",
          es: "Descanso, sanación y reseteo del sistema nervioso",
        },
        {
          en: "Personal expansion & new beginnings",
          es: "Expansión personal y nuevos comienzos",
        },
      ],
    },
    closing: {
      en: "Through your planetary lines and energetic map, this magazine-style report helps you understand not only where you may thrive — but who you become in different places around the world. Because sometimes, changing your environment changes everything.",
      es: "A través de tus líneas planetarias y tu mapa energético, este reporte tipo revista te ayuda a entender no solo dónde puedes prosperar — sino en quién te conviertes en diferentes lugares del mundo. Porque a veces, cambiar tu entorno lo cambia todo.",
    },
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
            const isFlipped = activeCard === i;

            return (
              <CardSlot
                key={card.slug}
                card={card}
                index={i}
                name={name}
                price={price}
                duration={card.fallbackDuration[lang]}
                isFlipped={isFlipped}
                lang={lang}
                onToggle={() => {
                  const next = isFlipped ? null : i;
                  setActiveCard(next);
                  if (next !== null) {
                    track("interaction", "tarot_card_flip", {
                      card_slug: card.slug,
                    });
                  }
                }}
                desktopLift={LIFT[i]}
              />
            );
          })}
        </div>

        {/* Detail panel */}
        {activeCard !== null && (
          <div
            id="tarot-detail"
            className="mt-12 md:mt-16 px-6 md:px-14 py-10 md:py-12 max-w-[1100px] mx-auto scroll-mt-24"
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
              {card.cardName[lang]} {card.emoji}
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
            <div className="flex-1 m-0 mb-3 overflow-hidden">
              {card.lead[lang].split("\n\n").map((para, i, arr) => (
                <p
                  key={`back-lead-${i}`}
                  className={`font-fraunces ${
                    i < arr.length - 1 ? "mb-3" : "mb-0"
                  }`}
                  style={{
                    fontStyle: "italic",
                    fontSize: 14,
                    color: "var(--ed-ink)",
                    lineHeight: 1.5,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
            <a
              href="#tarot-detail"
              data-analytics="cta_tarot_start_here"
              data-service-slug={card.slug}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                document
                  .getElementById("tarot-detail")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
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
              {lang === "en" ? "Start Here" : "Empieza Aquí"} →
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
  const bookingTarget = bookingForSlug(card.slug);
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
          {card.cardName[lang]} {card.emoji}
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
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 300,
            color: "var(--ed-ink)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
          }}
        >
          &ldquo;{card.hook[lang]}&rdquo;
        </p>

        <div
          className="mb-6"
          style={{ borderTop: "1px solid var(--ed-rule)" }}
        />

        {card.offering[lang].split("\n\n").map((para, i) => (
          <p
            key={`offering-${i}`}
            className="font-spectral m-0 mb-4"
            style={{
              fontSize: 16,
              color: "var(--ed-ink-soft)",
              lineHeight: 1.65,
            }}
          >
            {para}
          </p>
        ))}

        {card.bullets && (
          <div className="mt-2 mb-4">
            {card.bullets.intro?.[lang] && (
              <p
                className="font-spectral m-0 mb-2"
                style={{
                  fontSize: 15,
                  color: "var(--ed-ink-soft)",
                  lineHeight: 1.6,
                }}
              >
                {card.bullets.intro[lang]}
              </p>
            )}
            <ul className="list-none m-0 p-0">
              {card.bullets.items.map((item, i) => (
                <li
                  key={`bullet-${i}`}
                  className="font-spectral"
                  style={{
                    fontSize: 15,
                    color: "var(--ed-ink-soft)",
                    lineHeight: 1.7,
                    paddingLeft: "1.4em",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "var(--ed-rust)",
                    }}
                  >
                    —
                  </span>
                  {item[lang]}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p
          className="font-fraunces m-0 mt-5"
          style={{
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--ed-ink)",
            lineHeight: 1.55,
          }}
        >
          {card.closing[lang]}
        </p>

        {bookingTarget && (
          <BookAction
            target={bookingTarget}
            label={`${lang === "en" ? "Book Now" : "Reservar Ahora"} →`}
            analyticsName="cta_book_card"
            conversionName="booking_click"
            serviceSlug={card.slug}
            className="inline-block font-dm-mono uppercase mt-7"
            style={{
              background: "var(--ed-ink)",
              color: "var(--ed-paper)",
              padding: "14px 28px",
              fontSize: 11,
              letterSpacing: "0.22em",
              fontWeight: 500,
              textDecoration: "none",
              cursor: "pointer",
              border: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
