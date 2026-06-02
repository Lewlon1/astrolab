import LangText from "@/components/LangText";

const FEATURES: Array<{
  pp: string;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
}> = [
  {
    pp: "Pp. 04",
    titleEn: "The Founder",
    titleEs: "La Fundadora",
    descEn: "A psychotherapist's astrology",
    descEs: "Astrología desde la psicoterapia",
  },
  {
    pp: "Pp. 12",
    titleEn: "Five Sessions",
    titleEs: "Cinco Sesiones",
    descEn: "What's calling you?",
    descEs: "¿Qué te está llamando?",
  },
  {
    pp: "Pp. 28",
    titleEn: "Travel, Charted",
    titleEs: "Viajes, Trazados",
    descEn: "Your soul-guided magazine",
    descEs: "Tu revista guiada por el alma",
  },
  {
    pp: "Pp. 40",
    titleEn: "The Practice",
    titleEs: "La Práctica",
    descEn: "Letters from clients",
    descEs: "Cartas de clientes",
  },
];

export default function ContentsIndex() {
  return (
    <section
      className="px-6 md:px-14 py-16 md:py-24"
      style={{ borderBottom: "1px solid var(--ed-rule)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div
          className="pt-7 grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{ borderTop: "1px solid var(--ed-ink)" }}
        >
          {FEATURES.map((f) => (
            <div key={f.pp}>
              <div
                className="font-dm-mono mb-2.5"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "var(--ed-text-mute)",
                }}
              >
                {f.pp}
              </div>
              <div
                className="font-fraunces mb-1"
                style={{
                  fontStyle: "italic",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "var(--ed-ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                <LangText en={f.titleEn} es={f.titleEs} />
              </div>
              <div
                className="font-spectral"
                style={{
                  fontSize: 12.5,
                  color: "var(--ed-text-mute)",
                  lineHeight: 1.5,
                }}
              >
                <LangText en={f.descEn} es={f.descEs} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
