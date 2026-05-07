import type { Testimonial } from "@/types";
import LangText from "@/components/LangText";

type DemoCard = {
  quoteEn: string;
  quoteEs: string;
  name: string;
  contextEn: string;
  contextEs: string;
};

const DEMO: DemoCard[] = [
  {
    quoteEn:
      "Gabs helped me understand patterns I'd been repeating in every relationship. It wasn't just astrology — it was real psychological insight that changed how I approach love.",
    quoteEs:
      "Gabs me ayudó a entender patrones que repetía en cada relación. No era solo astrología — fue insight psicológico real que cambió cómo me acerco al amor.",
    name: "María C.",
    contextEn: "Cosmic Alliance · Madrid",
    contextEs: "Cosmic Alliance · Madrid",
  },
  {
    quoteEn:
      "I was at a career crossroads and the Stellar Insights session gave me clarity I hadn't found in months of overthinking. The Star energy was real.",
    quoteEs:
      "Estaba en una encrucijada profesional y Stellar Insights me dio la claridad que no había encontrado en meses. La energía de La Estrella fue real.",
    name: "Laura S.",
    contextEn: "Stellar Insights · Barcelona",
    contextEs: "Stellar Insights · Barcelona",
  },
  {
    quoteEn:
      "The Soul Guided Travel Magazine changed my plans completely. I visited a city on my Venus line and everything shifted — relationships, energy, creativity.",
    quoteEs:
      "La Revista de Viaje cambió mis planes completamente. Visité una ciudad en mi línea de Venus y todo cambió — relaciones, energía, creatividad.",
    name: "Ana P.",
    contextEn: "Travel Magazine · Online",
    contextEs: "Travel Magazine · Online",
  },
];

type Props = {
  testimonials: Testimonial[];
};

type Card = {
  quote: { en: string; es: string };
  name: string;
  detail: { en: string; es: string };
};

export default function Testimonials({ testimonials }: Props) {
  const cards: Card[] =
    testimonials.length > 0
      ? testimonials.map((t) => ({
          quote: { en: t.quote, es: t.quote },
          name: t.client_name,
          detail: {
            en: t.service_name ?? "",
            es: t.service_name ?? "",
          },
        }))
      : DEMO.map((d) => ({
          quote: { en: d.quoteEn, es: d.quoteEs },
          name: d.name,
          detail: { en: d.contextEn, es: d.contextEs },
        }));

  return (
    <section
      id="reviews"
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
            Pp. 40
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
            <LangText en="Letters" es="Cartas" />
          </span>
        </div>
        <h2
          className="font-fraunces m-0 mb-12 md:mb-16"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 300,
            color: "var(--ed-ink)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          <LangText
            en={
              <>
                From{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                >
                  the practice.
                </em>
              </>
            }
            es={
              <>
                Desde{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
                >
                  la práctica.
                </em>
              </>
            }
          />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {cards.map((c, i) => (
            <div key={`${c.name}-${i}`}>
              <div
                className="font-fraunces mb-6"
                style={{
                  fontStyle: "italic",
                  fontSize: 64,
                  color: "var(--ed-rust)",
                  lineHeight: 0.5,
                }}
                aria-hidden
              >
                &ldquo;
              </div>
              <p
                className="font-fraunces m-0 mb-7"
                style={{
                  fontSize: 22,
                  fontWeight: 300,
                  color: "var(--ed-ink)",
                  lineHeight: 1.4,
                  letterSpacing: "-0.01em",
                }}
              >
                <LangText en={c.quote.en} es={c.quote.es} />
              </p>
              <div
                className="pt-5"
                style={{ borderTop: "1px solid var(--ed-ink)" }}
              >
                <div
                  className="font-dm-mono uppercase"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    color: "var(--ed-ink)",
                  }}
                >
                  {c.name}
                </div>
                {c.detail.en || c.detail.es ? (
                  <div
                    className="font-spectral mt-1"
                    style={{
                      fontSize: 12,
                      color: "var(--ed-text-mute)",
                      fontStyle: "italic",
                    }}
                  >
                    <LangText en={c.detail.en} es={c.detail.es} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
