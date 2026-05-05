import LangText from "@/components/LangText";

const CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

export default function HomeCTA() {
  return (
    <section
      id="book"
      className="px-6 md:px-14 py-24 md:py-[140px] text-center"
      style={{ background: "var(--ed-paper-deep)" }}
    >
      <h2
        className="font-fraunces m-0 mb-8"
        style={{
          fontSize: "clamp(56px, 11vw, 120px)",
          fontWeight: 300,
          color: "var(--ed-ink)",
          lineHeight: 0.92,
          letterSpacing: "-0.04em",
        }}
      >
        <LangText
          en={
            <>
              Ready to read
              <br />
              <em
                style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
              >
                your map?
              </em>
            </>
          }
          es={
            <>
              ¿Lista para leer
              <br />
              <em
                style={{ fontStyle: "italic", color: "var(--ed-rust)" }}
              >
                tu mapa?
              </em>
            </>
          }
        />
      </h2>
      <p
        className="font-spectral mx-auto mb-10"
        style={{
          fontSize: 18,
          color: "var(--ed-ink-soft)",
          maxWidth: 540,
          margin: "0 auto 40px",
          lineHeight: 1.7,
        }}
      >
        <LangText
          en="Book a session and discover the patterns, dynamics, and directions written in your chart."
          es="Reserva una sesión y descubre los patrones, las dinámicas y las direcciones escritas en tu carta."
        />
      </p>
      <a
        href={CALENDLY}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block font-dm-mono uppercase"
        style={{
          background: "var(--ed-ink)",
          color: "var(--ed-paper)",
          padding: "18px 40px",
          fontSize: 12,
          letterSpacing: "0.24em",
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        <LangText en="Book Your Session →" es="Reserva Tu Sesión →" />
      </a>
    </section>
  );
}
