import LangText from "@/components/LangText";
import Loupe from "@/components/Loupe";
import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";

const FALLBACK_CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

type Props = {
  magazineCalendlyUrl?: string | null;
  editorialDate?: EditorialDate;
};

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

export default function MagazineDetail({
  magazineCalendlyUrl,
  editorialDate,
}: Props) {
  const bookHref = magazineCalendlyUrl ?? FALLBACK_CALENDLY;

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
            <a
              href={bookHref}
              target="_blank"
              rel="noopener noreferrer"
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
            >
              <LangText en="Order Your Issue →" es="Pide Tu Edición →" />
            </a>
          </div>

          {/* RIGHT: loupe */}
          <div className="relative order-1 md:order-2 flex flex-col items-center justify-center">
            <Loupe />
          </div>
        </div>
      </div>
    </section>
  );
}
