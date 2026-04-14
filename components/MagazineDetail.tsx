import LangText from "@/components/LangText";
import Reveal from "@/components/Reveal";

const FALLBACK_CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

type Props = {
  magazineCalendlyUrl?: string | null;
};

export default function MagazineDetail({ magazineCalendlyUrl }: Props) {
  const bookHref = magazineCalendlyUrl ?? FALLBACK_CALENDLY;

  return (
    <section className="magazine-section" id="magazine">
      <div className="mag-layout">
        <Reveal>
          <div className="mag-visual">
            <div className="mag-cover">
              <div className="mag-badge">
                <span>
                  <LangText
                    en={
                      <>
                        New
                        <br />
                        Product
                      </>
                    }
                    es={
                      <>
                        Nuevo
                        <br />
                        Producto
                      </>
                    }
                  />
                </span>
              </div>
              <div>
                <p className="mag-label">The Astro Psyche Lab</p>
              </div>
              <div className="mag-title-block">
                <h3>
                  <LangText
                    en={
                      <>
                        Soul Guided
                        <br />
                        <em>Travel Magazine</em>
                      </>
                    }
                    es={
                      <>
                        Revista de Viaje
                        <br />
                        <em>Guiada por el Alma</em>
                      </>
                    }
                  />
                </h3>
                <p>
                  <LangText
                    en="Where you go changes what unfolds for you. A personalised magazine based on your chart, transits, and astrocartography lines."
                    es="A donde vas cambia lo que se despliega para ti. Una revista personalizada basada en tu carta, tránsitos y líneas astrocartográficas."
                  />
                </p>
              </div>
              <div className="mag-features-list">
                <span>
                  <LangText
                    en="Top 5 destinations for your chart"
                    es="Top 5 destinos para tu carta"
                  />
                </span>
                <span>
                  <LangText
                    en="Activities aligned to your transits"
                    es="Actividades por tus tránsitos"
                  />
                </span>
                <span>
                  <LangText
                    en="Best timing for each trip"
                    es="Mejor momento para cada viaje"
                  />
                </span>
                <span>
                  <LangText
                    en="Soul-purpose travel rituals"
                    es="Rituales de viaje con propósito"
                  />
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="mag-text">
            <p className="section-eyebrow">
              <LangText en="Digital Product" es="Producto Digital" />
            </p>
            <h3>
              <LangText
                en={
                  <>
                    Your personalised{" "}
                    <em>soul guided travel magazine</em>
                  </>
                }
                es={
                  <>
                    Tu revista personalizada de{" "}
                    <em>viaje guiada por el alma</em>
                  </>
                }
              />
            </h3>
            <p>
              <LangText
                en="Not a generic horoscope guide. This is a bespoke digital magazine built entirely around your natal chart and current transits — revealing where in the world your energy is strongest right now, and what to do when you get there."
                es="No es una guía genérica. Es una revista digital hecha a medida con tu carta natal y tránsitos — revelando dónde en el mundo tu energía es más fuerte y qué hacer cuando llegues."
              />
            </p>

            <div className="mag-includes">
              <div className="mag-inc">
                <h5>
                  <LangText en="Top 5 Destinations" es="Top 5 Destinos" />
                </h5>
                <p>
                  <LangText
                    en="Cities on your strongest planetary lines — Venus for love, Jupiter for expansion, Sun for vitality."
                    es="Ciudades en tus líneas planetarias — Venus para amor, Júpiter para expansión, Sol para vitalidad."
                  />
                </p>
              </div>
              <div className="mag-inc">
                <h5>
                  <LangText
                    en="Curated Activities"
                    es="Actividades Curadas"
                  />
                </h5>
                <p>
                  <LangText
                    en="Experiences matched to your chart — retreats, cultural sites, nature spots, creative spaces."
                    es="Experiencias por tu carta — retiros, sitios culturales, naturaleza, espacios creativos."
                  />
                </p>
              </div>
              <div className="mag-inc">
                <h5>
                  <LangText en="Transit Timing" es="Timing de Tránsitos" />
                </h5>
                <p>
                  <LangText
                    en="Which months are optimal for each destination based on your current transits."
                    es="Qué meses son óptimos para cada destino según tus tránsitos actuales."
                  />
                </p>
              </div>
              <div className="mag-inc">
                <h5>
                  <LangText en="Soul Rituals" es="Rituales del Alma" />
                </h5>
                <p>
                  <LangText
                    en="Journaling prompts, meditation, and intention-setting tied to each location."
                    es="Escritura, meditación e intenciones ligadas a cada lugar."
                  />
                </p>
              </div>
            </div>

            <div className="mag-price-row">
              <span className="price">€75</span>
              <span className="note">
                <LangText
                  en="Digital PDF · delivered within 5 days"
                  es="PDF digital · entrega en 5 días"
                />
              </span>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <a
                href={bookHref}
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LangText
                  en="Order Your Magazine"
                  es="Pide Tu Revista"
                />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
