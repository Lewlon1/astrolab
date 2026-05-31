import Image from "next/image";
import LangText from "@/components/LangText";
import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";

type Props = {
  editorialDate?: EditorialDate;
};

export default function Founder({ editorialDate }: Props) {
  const ed = editorialDate ?? getEditorialDate();
  const figureEn = `FIG. 01 — GABRIELA · BARCELONA · ${ed.year}`;
  const figureEs = `FIG. 01 — GABRIELA · BARCELONA · ${ed.year}`;

  return (
    <section
      id="founder"
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
            Pp. 04
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
            <LangText en="Feature" es="Reportaje" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 md:gap-20 items-start">
          {/* Photo + caption */}
          <div className="relative">
            <Image
              src="/images/gabriela_door.jpg"
              alt="Gabriela — Founder of The Astro Psyche Lab"
              width={600}
              height={900}
              priority
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: "4 / 5",
                objectFit: "cover",
                objectPosition: "center 35%",
                filter: "grayscale(0.1) contrast(1.05)",
                display: "block",
              }}
            />
            <div
              className="font-dm-mono mt-3"
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "var(--ed-text-mute)",
              }}
            >
              <LangText en={figureEn} es={figureEs} />
            </div>

            {/* Big Three callout — sits under the photo */}
            <div
              className="mt-6 p-6"
              style={{
                background: "var(--ed-paper-deep)",
                borderLeft: "3px solid var(--ed-rust)",
              }}
            >
              <div
                className="font-dm-mono uppercase mb-2"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--ed-text-mute)",
                }}
              >
                <LangText en="The Big Three" es="Los Tres Grandes" />
              </div>
              <div
                className="font-fraunces"
                style={{
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "var(--ed-ink)",
                }}
              >
                <LangText
                  en="☉ Pisces Sun · ☽ Sagittarius Moon · ↑ Taurus Rising"
                  es="☉ Sol en Piscis · ☽ Luna en Sagitario · ↑ Ascendente en Tauro"
                />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="pt-2 md:pt-5">
            <h2
              className="font-fraunces m-0 mb-9"
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
                    A{" "}
                    <em
                      style={{
                        fontStyle: "italic",
                        color: "var(--ed-rust)",
                      }}
                    >
                      psychotherapist&apos;s
                    </em>{" "}
                    astrology.
                  </>
                }
                es={
                  <>
                    Una astrología desde la{" "}
                    <em
                      style={{
                        fontStyle: "italic",
                        color: "var(--ed-rust)",
                      }}
                    >
                      psicoterapia.
                    </em>
                  </>
                }
              />
            </h2>

            <div
              className="font-dm-mono uppercase mb-4"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--ed-text-mute)",
              }}
            >
              <LangText
                en="By Gabriela · 6 min read"
                es="Por Gabriela · 6 min de lectura"
              />
            </div>

            <p
              className="font-spectral m-0 mb-4 ed-dropcap"
              style={{
                fontSize: 17,
                color: "var(--ed-ink-soft)",
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              <LangText
                en={
                  <>
                    Puerto Rico born and now Europe based, I&apos;m Gabriela, a
                    psychotherapist with over 10 years in the field and a lover
                    of astrology. I created the Astro Psyche Lab, a carefully
                    designed project that fuses my profession and passion into
                    tailored sessions for you.
                  </>
                }
                es={
                  <>
                    Puerto Rico born and now Europe based — I&apos;m Gabriela,
                    psicoterapeuta con más de 10 años en el campo y amante de la
                    astrología. Creé el Astro Psyche Lab, un proyecto que
                    fusiona mi profesión y pasión en sesiones personalizadas
                    para ti.
                  </>
                }
              />
            </p>
            <p
              className="font-spectral m-0 mb-9"
              style={{
                fontSize: 17,
                color: "var(--ed-ink-soft)",
                lineHeight: 1.7,
                fontWeight: 400,
              }}
            >
              <LangText
                en="A Spanglish sanctuary where psychology and astrology meet — offering cosmic insight to a vibrant, curious community ready for radical growth and deeper alignment."
                es="Un santuario Spanglish donde la psicología y la astrología se encuentran — ofreciendo insight cósmico a una comunidad vibrante y curiosa, lista para un crecimiento radical y una alineación más profunda."
              />
            </p>

            {/* Stats */}
            <div
              className="grid grid-cols-1 pt-7"
              style={{ borderTop: "1px solid var(--ed-ink)" }}
            >
              {[
                {
                  num: "10+",
                  labelEn: "Years\nin Psychology",
                  labelEs: "Años en\nPsicología",
                },
              ].map((d, i) => (
                <div
                  key={d.num}
                  style={{
                    paddingLeft: i === 0 ? 0 : 24,
                    borderLeft: i === 0 ? "none" : "1px solid var(--ed-rule)",
                  }}
                >
                  <div
                    className="font-fraunces"
                    style={{
                      fontStyle: "italic",
                      fontSize: 38,
                      fontWeight: 400,
                      color: "var(--ed-rust)",
                      lineHeight: 1,
                    }}
                  >
                    {d.num}
                  </div>
                  <div
                    className="font-dm-mono uppercase mt-2"
                    style={{
                      fontSize: 11,
                      color: "var(--ed-text-mute)",
                      letterSpacing: "0.14em",
                      whiteSpace: "pre-line",
                      lineHeight: 1.4,
                    }}
                  >
                    <LangText en={d.labelEn} es={d.labelEs} />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="font-dm-mono uppercase mt-4"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--ed-text-mute)",
              }}
            >
              <LangText
                en="Bilingual EN/ES · Remote + In Person"
                es="Bilingüe EN/ES · Remoto + Presencial"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
