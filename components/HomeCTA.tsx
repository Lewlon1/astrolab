import LangText from "@/components/LangText";

const CALENDLY = "https://calendly.com/astropsychelabadmi/30min";

export default function HomeCTA() {
  return (
    <section className="cta-section" id="book">
      <h2 className="cta-title">
        <LangText
          en="Ready to read your map?"
          es="¿Lista para leer tu mapa?"
        />
      </h2>
      <p className="cta-sub">
        <LangText
          en="Book a session and discover the psychological patterns, relationship dynamics, and life directions written in your chart."
          es="Reserva una sesión y descubre los patrones psicológicos y direcciones de vida escritas en tu carta."
        />
      </p>
      <a
        href={CALENDLY}
        className="btn-white"
        target="_blank"
        rel="noopener noreferrer"
      >
        <LangText
          en="Book Your Session"
          es="Reserva Tu Sesión"
        />
      </a>
    </section>
  );
}
