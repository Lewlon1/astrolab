"use client";

import LangText from "@/components/LangText";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden />
      <div className="hero-orbs" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>

      <div className="hero-content">
        <div className="hero-eyebrow">
          <LangText
            en="Astrological Psychology · Barcelona"
            es="Psicología Astrológica · Barcelona"
          />
        </div>

        <h1 className="hero-title">
          <LangText
            en={
              <>
                Your chart is a map.
                <br />
                <em>Let&apos;s read it together.</em>
              </>
            }
            es={
              <>
                Tu carta es un mapa.
                <br />
                <em>Leámoslo juntas.</em>
              </>
            }
          />
        </h1>

        <p className="hero-sub">
          <LangText
            en="Career clarity, relationship insights, and soul-driven travel — grounded in Jungian astro-psychology and your unique natal blueprint."
            es="Claridad profesional, relaciones conscientes y viajes con propósito — basados en psicología junguiana y tu carta natal única."
          />
        </p>

        <div className="hero-ctas">
          <a href="#tarot" className="btn-primary">
            <LangText en="Draw a Card" es="Saca una Carta" />
          </a>
          <a href="#founder" className="btn-secondary">
            <LangText en="Meet Gabriela" es="Conoce a Gabriela" />
          </a>
        </div>
      </div>
    </section>
  );
}
