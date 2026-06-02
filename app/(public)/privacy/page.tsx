import LangText from "@/components/LangText";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export const metadata = {
  title: "Cookie & Privacy Notice",
  description:
    "How The Astro Psyche Lab uses cookies and your data, and how to manage your consent.",
};

type Row = {
  name: string;
  purposeEn: string;
  purposeEs: string;
  categoryEn: string;
  categoryEs: string;
};

const COOKIES: Row[] = [
  {
    name: "Vercel Web Analytics",
    purposeEn: "Aggregate, anonymous traffic measurement. Cookieless.",
    purposeEs: "Medición de tráfico agregada y anónima. Sin cookies.",
    categoryEn: "Necessary / always on",
    categoryEs: "Necesaria / siempre activa",
  },
  {
    name: "Meta Pixel (Facebook/Instagram)",
    purposeEn:
      "Measures ad performance and builds retargeting audiences. Sends data to Meta, including via Meta's Conversions API.",
    purposeEs:
      "Mide el rendimiento de los anuncios y crea audiencias de retargeting. Envía datos a Meta, incluso a través de la Conversions API de Meta.",
    categoryEn: "Marketing / consent required",
    categoryEs: "Marketing / requiere consentimiento",
  },
  {
    name: "ManyChat",
    purposeEn: "Powers the chat / messaging widget.",
    purposeEs: "Hace funcionar el chat / widget de mensajería.",
    categoryEn: "Marketing / consent required",
    categoryEs: "Marketing / requiere consentimiento",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <div style={{ height: "5rem" }} aria-hidden />
      <section className="px-6 md:px-14 py-16 md:py-24">
        <div className="max-w-[760px] mx-auto">
          <div
            className="font-dm-mono uppercase mb-4"
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              color: "var(--ed-rust)",
            }}
          >
            <LangText en="Cookies & Privacy" es="Cookies y Privacidad" />
          </div>
          <h1
            className="font-fraunces m-0 mb-8"
            style={{
              fontSize: "clamp(34px, 5vw, 56px)",
              fontWeight: 300,
              color: "var(--ed-ink)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            <LangText
              en="How we use cookies"
              es="Cómo usamos las cookies"
            />
          </h1>

          <div
            className="font-spectral"
            style={{
              fontSize: 16,
              color: "var(--ed-ink-soft)",
              lineHeight: 1.7,
            }}
          >
            <p className="m-0 mb-5">
              <LangText
                en="The Astro Psyche Lab (Barcelona, Spain) uses cookies and similar technologies. Necessary cookies run so the site works and so we can measure traffic anonymously. Marketing cookies — the Meta Pixel and our chat widget — only run after you accept them. You can change or withdraw your choice at any time."
                es="The Astro Psyche Lab (Barcelona, España) usa cookies y tecnologías similares. Las cookies necesarias funcionan para que el sitio opere y para medir el tráfico de forma anónima. Las cookies de marketing — el Meta Pixel y nuestro chat — solo funcionan después de que las aceptes. Puedes cambiar o retirar tu elección en cualquier momento."
              />
            </p>

            <h2
              className="font-fraunces mt-10 mb-4"
              style={{
                fontStyle: "italic",
                fontSize: 24,
                fontWeight: 400,
                color: "var(--ed-ink)",
              }}
            >
              <LangText en="What we use" es="Qué usamos" />
            </h2>

            <div
              className="grid gap-px mb-6"
              style={{ background: "var(--ed-rule)", border: "1px solid var(--ed-rule)" }}
            >
              {COOKIES.map((c) => (
                <div
                  key={c.name}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-1 md:gap-6 p-4"
                  style={{ background: "var(--ed-paper)" }}
                >
                  <div
                    className="font-dm-mono"
                    style={{
                      fontSize: 13,
                      color: "var(--ed-ink)",
                      fontWeight: 500,
                    }}
                  >
                    {c.name}
                    <div
                      className="mt-1 uppercase"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.16em",
                        color: "var(--ed-text-mute)",
                      }}
                    >
                      <LangText en={c.categoryEn} es={c.categoryEs} />
                    </div>
                  </div>
                  <p className="m-0" style={{ fontSize: 14.5 }}>
                    <LangText en={c.purposeEn} es={c.purposeEs} />
                  </p>
                </div>
              ))}
            </div>

            <h2
              className="font-fraunces mt-10 mb-4"
              style={{
                fontStyle: "italic",
                fontSize: 24,
                fontWeight: 400,
                color: "var(--ed-ink)",
              }}
            >
              <LangText en="Manage your choice" es="Gestiona tu elección" />
            </h2>
            <p className="m-0 mb-5">
              <LangText
                en="Use the button below (also in the footer of every page) to review or change your cookie consent."
                es="Usa el botón de abajo (también en el pie de cada página) para revisar o cambiar tu consentimiento de cookies."
              />
            </p>
            <div
              className="inline-block"
              style={{
                border: "1px solid var(--ed-ink)",
                padding: "11px 22px",
                color: "var(--ed-ink)",
                letterSpacing: "0.18em",
              }}
            >
              <CookieSettingsButton />
            </div>

            <p
              className="m-0 mt-10"
              style={{ fontSize: 13, color: "var(--ed-text-mute)", lineHeight: 1.6 }}
            >
              <LangText
                en="Questions about your data? Email astropsychelabadmi@gmail.com. This notice is a plain-language summary and a starting point — please review it with your own legal/GDPR advisor before scaling advertising."
                es="¿Preguntas sobre tus datos? Escribe a astropsychelabadmi@gmail.com. Este aviso es un resumen en lenguaje sencillo y un punto de partida — revísalo con tu asesor legal/RGPD antes de escalar la publicidad."
              />
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
