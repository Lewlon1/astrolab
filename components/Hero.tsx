"use client";

import LangText from "@/components/LangText";
import WelcomeLetter from "@/components/WelcomeLetter";
import DeckPeek from "@/components/DeckPeek";
import { getEditorialDate, type EditorialDate } from "@/lib/editorialDate";

type Props = {
  editorialDate?: EditorialDate;
};

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

export default function Hero({ editorialDate }: Props) {
  const ed = editorialDate ?? getEditorialDate();
  const coverEn = `Cover Story · Issue ${ed.issueNum}`;
  const coverEs = `Portada · Número ${ed.issueNum}`;

  return (
    <section
      className="px-6 md:px-14 pt-12 md:pt-20 pb-16 md:pb-24"
      style={{ borderBottom: "1px solid var(--ed-rule)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* 1. Cover Story dateline (top) */}
        <div
          className="font-dm-mono uppercase text-center mb-10 md:mb-14"
          style={{
            fontSize: 11,
            letterSpacing: "0.28em",
            color: "var(--ed-rust)",
          }}
        >
          <LangText en={coverEn} es={coverEs} />
        </div>

        {/* 2. Welcome Letter (magazine headline) */}
        <div className="mb-16 md:mb-24">
          <WelcomeLetter />
        </div>

        {/* 3. Big Jung pull-quote */}
        <blockquote
          className="m-0 mx-auto text-center mb-16 md:mb-24"
          style={{ maxWidth: 820 }}
        >
          <p
            className="font-fraunces m-0"
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(34px, 5.2vw, 60px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ed-ink)",
            }}
          >
            <span style={{ color: "var(--ed-rust)" }}>&ldquo;</span>
            <LangText
              en="The privilege of a lifetime is to become who you truly are."
              es="El privilegio de una vida es convertirse en quien verdaderamente eres."
            />
            <span style={{ color: "var(--ed-rust)" }}>&rdquo;</span>
          </p>
          <div
            className="font-dm-mono uppercase mt-6"
            style={{
              fontSize: 11,
              letterSpacing: "0.28em",
              color: "var(--ed-text-mute)",
            }}
          >
            — C.G. Jung
          </div>
        </blockquote>

        {/* 4. Cards + CTAs */}
        <div className="flex flex-col items-center gap-4 mb-16 md:mb-24">
          <DeckPeek />
          <div className="flex flex-wrap justify-center gap-3.5">
            <a
              href="#tarot"
              className="font-dm-mono uppercase"
              style={{
                background: "var(--ed-ink)",
                color: "var(--ed-paper)",
                padding: "14px 26px",
                fontSize: 11,
                letterSpacing: "0.2em",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <LangText en="Draw a Card →" es="Saca una Carta →" />
            </a>
            <a
              href="#founder"
              className="font-dm-mono uppercase"
              style={{
                background: "transparent",
                color: "var(--ed-ink)",
                border: "1px solid var(--ed-ink)",
                padding: "14px 26px",
                fontSize: 11,
                letterSpacing: "0.2em",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <LangText en="Meet Gabriela" es="Conoce a Gabriela" />
            </a>
          </div>
        </div>

        {/* 5. Closing headline */}
        <h1
          className="font-fraunces text-center m-0"
          style={{
            fontSize: "clamp(56px, 11vw, 124px)",
            fontWeight: 300,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            color: "var(--ed-ink)",
          }}
        >
          <LangText
            en={
              <>
                Your chart
                <br />
                is a{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--ed-rust)",
                  }}
                >
                  map.
                </em>
              </>
            }
            es={
              <>
                Tu carta
                <br />
                es un{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--ed-rust)",
                  }}
                >
                  mapa.
                </em>
              </>
            }
          />
        </h1>
        <h2
          className="font-instrument text-center m-0 mt-6"
          style={{
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(24px, 3.5vw, 38px)",
            color: "var(--ed-ink-soft)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
          }}
        >
          <LangText en="Let's read it together." es="Leámoslo juntas." />
        </h2>

        {/* Feature strip */}
        <div
          className="mt-12 md:mt-20 pt-7 grid grid-cols-2 md:grid-cols-4 gap-8"
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
