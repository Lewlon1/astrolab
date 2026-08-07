"use client";

import { useLang } from "@/context/LangContext";
import LangText from "@/components/LangText";
import ServiceRowCard from "@/components/services/ServiceRowCard";
import EditorialFAQ, {
  type EditorialFAQItem,
} from "@/components/services/EditorialFAQ";
import { localizeService, SERVICE_CARD_LABELS } from "@/lib/services";
import type { Service } from "@/types";

const FAQ_ITEMS: EditorialFAQItem[] = [
  {
    q: {
      en: "What do I need to prepare?",
      es: "¿Qué necesito preparar?",
    },
    a: {
      en: "Your birth date, exact time, and location.",
      es: "Tu fecha de nacimiento, hora exacta y lugar.",
    },
  },
  {
    q: {
      en: "How are sessions delivered?",
      es: "¿Cómo se realizan las sesiones?",
    },
    a: {
      en: "Via Zoom, recorded so you can rewatch.",
      es: "Por Zoom, grabadas para que puedas volver a verlas.",
    },
  },
  {
    q: {
      en: "Can I gift a session?",
      es: "¿Puedo regalar una sesión?",
    },
    a: {
      en: "Yes! Email me for a gift voucher.",
      es: "¡Sí! Escríbeme por correo para un vale de regalo.",
    },
  },
  {
    q: {
      en: "What's the difference between Stellar Insights and Cosmic Alliance?",
      es: "¿Cuál es la diferencia entre Stellar Insights y Cosmic Alliance?",
    },
    a: {
      en: "Stellar Insights is a deep-dive into your patterns and purpose. Cosmic Alliance adds astrocartography and is the full integration roadmap.",
      es: "Stellar Insights es una inmersión profunda en tus patrones y propósito. Cosmic Alliance añade astrocartografía y es la hoja de ruta de integración completa.",
    },
  },
];

export default function ServicesPageContent({
  services,
}: {
  services: Service[];
}) {
  const { lang } = useLang();
  const labels = SERVICE_CARD_LABELS[lang];

  return (
    <>
      {/* Hero */}
      <section
        className="px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16"
        style={{ borderBottom: "1px solid var(--ed-rule)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <span
              className="font-dm-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--ed-text-mute)",
              }}
            >
              Pp. 24
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
              <LangText en="Index of Services" es="Índice de Servicios" />
            </span>
          </div>
          <h1
            className="font-fraunces m-0 mb-6"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 300,
              color: "var(--ed-ink)",
              letterSpacing: "-0.03em",
            }}
          >
            <LangText
              en={
                <>
                  Find your{" "}
                  <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                    reading.
                  </em>
                </>
              }
              es={
                <>
                  Encuentra tu{" "}
                  <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                    lectura.
                  </em>
                </>
              }
            />
          </h1>
          <p
            className="font-spectral m-0 max-w-[560px]"
            style={{
              fontSize: 17,
              color: "var(--ed-ink-soft)",
              lineHeight: 1.65,
            }}
          >
            <LangText
              en="Every session blends astrological precision with psychological insight. Start free, go as deep as you need."
              es="Cada sesión combina precisión astrológica con perspectiva psicológica. Empieza gratis y profundiza tanto como necesites."
            />
          </p>
        </div>
      </section>

      {/* Services grid */}
      {services.length > 0 && (
        <section className="px-6 md:px-14 py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto">
            <div
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ borderTop: "1px solid var(--ed-ink)" }}
            >
              {services.map((service, i) => (
                <ServiceRowCard
                  key={service.id}
                  item={localizeService(service, lang)}
                  index={i + 1}
                  labels={labels}
                  showDivider={(i + 1) % 3 !== 0 && i !== services.length - 1}
                  inset={i % 3 !== 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 md:px-14 pb-20 md:pb-[120px]">
        <div className="max-w-[760px] mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <span
              className="font-dm-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.24em",
                color: "var(--ed-rust)",
              }}
            >
              FAQ
            </span>
            <span
              className="flex-1"
              style={{ height: 1, background: "var(--ed-rule)" }}
            />
          </div>
          <h2
            className="font-fraunces m-0 mb-10"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 300,
              color: "var(--ed-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            <LangText
              en={
                <>
                  Common{" "}
                  <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                    questions.
                  </em>
                </>
              }
              es={
                <>
                  Preguntas{" "}
                  <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                    frecuentes.
                  </em>
                </>
              }
            />
          </h2>
          <EditorialFAQ items={FAQ_ITEMS} />
        </div>
      </section>
    </>
  );
}
