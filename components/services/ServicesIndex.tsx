"use client";

import { useState } from "react";
import { useLang } from "@/context/LangContext";
import LangText from "@/components/LangText";
import ServiceRowCard from "@/components/services/ServiceRowCard";
import EditorialFAQ from "@/components/services/EditorialFAQ";
import { SERVICES_FAQ_ITEMS } from "@/components/services/faqItems";
import { localizeService, SERVICE_CARD_LABELS } from "@/lib/services";
import type { Service } from "@/types";

type Props = {
  services: Service[];
};

export default function ServicesIndex({ services }: Props) {
  const { lang } = useLang();
  const [faqOpen, setFaqOpen] = useState(false);

  if (!services || services.length === 0) return null;

  const labels = SERVICE_CARD_LABELS[lang];

  return (
    <section
      id="services"
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
            Pp. 48
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
            <LangText en="The Offerings" es="Los Servicios" />
          </span>
        </div>
        <h2
          className="font-fraunces m-0 mb-5 md:mb-6"
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
                Every{" "}
                <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                  service.
                </em>
              </>
            }
            es={
              <>
                Cada{" "}
                <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                  servicio.
                </em>
              </>
            }
          />
        </h2>

        <p
          className="font-spectral m-0 mb-12 md:mb-14"
          style={{ fontSize: 17, color: "var(--ed-ink-soft)", lineHeight: 1.6 }}
        >
          <LangText
            en="Not sure where to start? "
            es="¿No sabes por dónde empezar? "
          />
          <a
            href="#tarot"
            data-analytics="cta_services_leadin_tarot"
            style={{
              color: "var(--ed-rust)",
              textDecoration: "none",
              borderBottom: "1px solid var(--ed-rust)",
            }}
          >
            <LangText en="Draw a card." es="Saca una carta." />
          </a>
        </p>

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

        <div className="mt-14 md:mt-16 max-w-[760px] mx-auto">
          <button
            type="button"
            onClick={() => setFaqOpen((o) => !o)}
            aria-expanded={faqOpen}
            aria-controls="services-faq"
            data-analytics="services_faq_toggle"
            className="flex w-full items-center gap-4 text-left"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              className="font-dm-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.24em",
                color: "var(--ed-rust)",
              }}
            >
              <LangText en="Frequently asked questions" es="Preguntas frecuentes" />
            </span>
            <span
              className="flex-1"
              style={{ height: 1, background: "var(--ed-rule)" }}
            />
            <span
              aria-hidden
              style={{
                color: "var(--ed-rust)",
                fontSize: 22,
                fontWeight: 300,
                transition: "transform 0.3s",
                transform: faqOpen ? "rotate(45deg)" : undefined,
              }}
            >
              +
            </span>
          </button>
          {faqOpen && (
            <div id="services-faq" className="mt-8">
              <EditorialFAQ items={SERVICES_FAQ_ITEMS} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
