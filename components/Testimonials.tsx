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

export default function Testimonials({ testimonials }: Props) {
  const hasDb = testimonials.length > 0;

  return (
    <section className="testimonials" id="reviews">
      <div style={{ textAlign: "center" }}>
        <p className="section-eyebrow">
          <LangText en="Client Stories" es="Historias de Clientes" />
        </p>
        <h2 className="section-title">
          <LangText en="Transformations" es="Transformaciones" />
        </h2>
      </div>
      <div className="testimonial-track">
        {hasDb
          ? testimonials.map((t) => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">&ldquo;{t.quote}&rdquo;</p>
                <p className="testimonial-author">
                  {t.client_name}
                  {t.service_name ? <span>{t.service_name}</span> : null}
                </p>
              </div>
            ))
          : DEMO.map((d, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">
                  &ldquo;<LangText en={d.quoteEn} es={d.quoteEs} />&rdquo;
                </p>
                <p className="testimonial-author">
                  {d.name}
                  <span>
                    <LangText en={d.contextEn} es={d.contextEs} />
                  </span>
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
