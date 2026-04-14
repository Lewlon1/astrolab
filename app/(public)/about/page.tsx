import Link from "next/link";
import Founder from "@/components/Founder";
import JungRibbon from "@/components/JungRibbon";

export const metadata = {
  title: "About Gabs",
  description:
    "The human behind the charts. Gabs blends astrology with psychology to help you decode your patterns and rewrite your story.",
};

const approaches = [
  {
    title: "Astrology as language",
    description:
      "Your birth chart is a map of psychological patterns — not a fixed fate. I read it as a living language that reveals your wiring, your rhythms, and your potential.",
  },
  {
    title: "Psychology as depth",
    description:
      "I go beyond prediction into self-understanding. Every aspect and placement connects to real patterns in how you relate, react, and grow.",
  },
  {
    title: "Integration as practice",
    description:
      "Insight without action is just entertainment. I help you turn what you learn into real-world change — in your relationships, career, and sense of self.",
  },
];

const credentials = [
  "Psychological Astrology Certification — Centre for Psychological Astrology, London",
  "BSc Psychology — University of Barcelona",
  "Certified Integrative Coach — ICF accredited programme",
  "200+ birth chart readings delivered",
  "Ongoing study in Jungian psychology and archetypal astrology",
];

export default function AboutPage() {
  return (
    <>
      {/* Spacer for fixed header */}
      <div style={{ height: "5rem" }} aria-hidden />

      {/* Section 1 — Founder block (reused) */}
      <Founder />

      <JungRibbon />

      {/* Section 2 — Approach */}
      <section
        style={{
          padding: "6rem 2rem",
          background: "var(--cream)",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p className="section-eyebrow">Philosophy</p>
          <h2 className="section-title">My approach</h2>
        </div>
        <div
          style={{
            maxWidth: "1050px",
            margin: "3rem auto 0",
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {approaches.map((item) => (
            <div
              key={item.title}
              style={{
                background: "white",
                border: "1px solid rgba(184, 160, 112, 0.3)",
                borderRadius: "16px",
                padding: "2rem 1.75rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  color: "var(--deep-brown)",
                  marginBottom: "0.75rem",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Credentials */}
      <section
        style={{
          padding: "6rem 2rem",
          background: "white",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p className="section-eyebrow">Credentials</p>
          <h2 className="section-title">Training &amp; background</h2>
        </div>
        <ul
          style={{
            maxWidth: "760px",
            margin: "3rem auto 0",
            listStyle: "none",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {credentials.map((item) => (
            <li
              key={item}
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                paddingLeft: "1rem",
                borderLeft: "2px solid var(--gold)",
                lineHeight: 1.7,
                fontWeight: 300,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
        <p
          style={{
            marginTop: "3rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          <a
            href="https://www.instagram.com/astropsychelab/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--gold)",
              textDecoration: "none",
              borderBottom: "1px solid transparent",
            }}
          >
            Follow @astropsychelab on Instagram
          </a>
        </p>
      </section>

      {/* Section 4 — CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to decode your chart?</h2>
        <p className="cta-sub">
          Whether you&apos;re curious about your patterns or ready for deep
          transformation, there&apos;s a session for you.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <Link href="/services" className="btn-white">
            Explore services
          </Link>
          <Link
            href="/#lead-capture"
            className="btn-primary"
            style={{
              background: "transparent",
              border: "1.5px solid white",
              color: "white",
            }}
          >
            Get your free Love &amp; Career Code
          </Link>
        </div>
      </section>
    </>
  );
}
