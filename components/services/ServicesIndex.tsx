"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import LangText from "@/components/LangText";
import ServiceRowCard from "@/components/services/ServiceRowCard";
import { localizeService, SERVICE_CARD_LABELS } from "@/lib/services";
import type { Service } from "@/types";

type Props = {
  services: Service[];
};

export default function ServicesIndex({ services }: Props) {
  const { lang } = useLang();

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
          className="font-fraunces m-0 mb-12 md:mb-14"
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
                  session.
                </em>
              </>
            }
            es={
              <>
                Cada{" "}
                <em style={{ fontStyle: "italic", color: "var(--ed-rust)" }}>
                  sesión.
                </em>
              </>
            }
          />
        </h2>

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

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="font-dm-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "var(--ed-rust)",
              textDecoration: "none",
              borderBottom: "1px solid transparent",
            }}
          >
            <LangText en="View all details →" es="Ver todos los detalles →" />
          </Link>
        </div>
      </div>
    </section>
  );
}
