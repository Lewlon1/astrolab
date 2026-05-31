"use client";

import { useEffect, useState } from "react";
import LangText from "@/components/LangText";
import EnvelopePenArt from "@/components/EnvelopePenArt";

const BODY_S1_EN =
  "A space created for the astro-curious, the career-driven, and those devoted to personal growth and deeper self-understanding.";
const BODY_S2_EN =
  "Astro Psyche Lab blends astrology and psychology to offer clarity, affirmation, and insight in a world that can often feel overwhelming and uncertain.";
const BODY_S3_EN =
  "Through cosmic perspective and emotional awareness, the Lab exists to help you reconnect with your authentic self and better understand the patterns shaping your journey.";

const BODY_S1_ES = BODY_S1_EN;
const BODY_S2_ES = BODY_S2_EN;
const BODY_S3_ES = BODY_S3_EN;

// Faint paper grain (cheap SVG noise) + a warm tonal wash.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E\")";

type Props = { onEnter?: () => void; autoUnfold?: boolean };

export default function WelcomeLetter({
  onEnter,
  autoUnfold = false,
}: Props = {}) {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setReduced(true);
      setOpen(true);
      return;
    }
    // Opened from the envelope mock-up: play the unfold automatically.
    if (autoUnfold) {
      const t = window.setTimeout(() => setOpen(true), 260);
      return () => window.clearTimeout(t);
    }
  }, [autoUnfold]);

  const ease = "cubic-bezier(.5,.05,.2,1)";
  const fadeUp = (delayMs: number) => ({
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(8px)",
    transition: reduced
      ? "none"
      : `opacity 520ms ease ${delayMs}ms, transform 520ms ${ease} ${delayMs}ms`,
  });

  // Shared torn-paper background for both the closed cover and the open note.
  const paperBg: React.CSSProperties = {
    backgroundColor: "var(--ed-paper)",
    backgroundImage: `${GRAIN}, radial-gradient(120% 80% at 30% 8%, #FBF7EF 0%, var(--ed-paper) 42%, var(--ed-paper-deep) 100%)`,
    filter: "url(#apl-deckle)",
    boxShadow:
      "0 30px 70px -28px rgba(40,30,20,.55), inset 0 0 0 1px rgba(255,255,255,.35), inset 0 2px 12px rgba(255,255,255,.45)",
  };

  return (
    <div
      className="relative mx-auto"
      style={{
        width: open ? "min(94vw, 880px)" : "min(92vw, 460px)",
        height: open ? "min(90vh, 760px)" : 268,
        perspective: 1600,
        transition: reduced
          ? "none"
          : `width 720ms ${ease}, height 720ms ${ease}`,
      }}
    >
      {/* deckle (torn-edge) displacement filter — defined once, off-screen */}
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        style={{ position: "absolute" }}
      >
        <filter id="apl-deckle" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.014"
            numOctaves={3}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={16}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* ===== OPEN NOTE (revealed beneath the cover) ===== */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* torn paper sheet */}
        <div aria-hidden="true" className="absolute inset-0" style={paperBg} />
        {/* faint ruled lines, like a writing pad */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            inset: "16px 18px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 37px, rgba(63,85,96,.07) 37px 38px)",
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 64px, #000 calc(100% - 40px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 64px, #000 calc(100% - 40px), transparent 100%)",
          }}
        />

        {/* content */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            padding: "clamp(28px, 4.5vw, 56px) clamp(26px, 5vw, 64px)",
          }}
        >
          <div
            className="font-dm-mono uppercase flex justify-between items-baseline"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--ed-text-mute)",
              marginBottom: "clamp(14px, 2.4vw, 26px)",
              ...fadeUp(360),
            }}
          >
            <span>
              <LangText en="Fig. 01 · A Letter" es="Fig. 01 · Una Carta" />
            </span>
            <span style={{ color: "var(--ed-rust)" }}>
              <LangText en="From the Lab" es="Desde el Lab" />
            </span>
          </div>

          {/* abstract letterhead motif */}
          <div
            style={{
              marginBottom: "clamp(4px, 1.4vw, 12px)",
              ...fadeUp(400),
            }}
          >
            <EnvelopePenArt width={116} />
          </div>

          <h3
            className="font-caveat m-0"
            style={{
              fontSize: "clamp(34px, 6vw, 56px)",
              fontWeight: 600,
              color: "var(--ed-rust)",
              lineHeight: 1,
              marginBottom: "clamp(16px, 2.6vw, 28px)",
              ...fadeUp(440),
              transform: open
                ? "rotate(-1.2deg)"
                : "rotate(-1.2deg) translateY(8px)",
            }}
          >
            <LangText en="Welcome to the Lab." es="Bienvenida al Lab." />
          </h3>

          <div
            className="font-caveat"
            style={{
              fontSize: "clamp(20px, 2.5vw, 27px)",
              lineHeight: 1.62,
              color: "#2C2A22",
              fontWeight: 500,
              maxWidth: "60ch",
            }}
          >
            <p className="m-0" style={fadeUp(580)}>
              <LangText en={BODY_S1_EN} es={BODY_S1_ES} />
            </p>
            <p
              className="m-0"
              style={{ marginTop: "0.7em", ...fadeUp(720) }}
            >
              <LangText en={BODY_S2_EN} es={BODY_S2_ES} />
            </p>
            <p
              className="m-0"
              style={{ marginTop: "0.7em", ...fadeUp(860) }}
            >
              <LangText en={BODY_S3_EN} es={BODY_S3_ES} />
            </p>
          </div>

          <div
            className="flex items-end justify-between gap-6 flex-wrap"
            style={{ marginTop: "clamp(20px, 3vw, 36px)" }}
          >
            <div
              className="font-caveat"
              style={{
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 600,
                color: "var(--ed-ink-soft)",
                lineHeight: 0.9,
                ...fadeUp(1000),
                transform: open
                  ? "rotate(-2deg)"
                  : "rotate(-2deg) translateY(8px)",
              }}
            >
              <LangText en="— Gabriela" es="— Gabriela" />
            </div>
            {onEnter && (
              <button
                type="button"
                onClick={onEnter}
                className="font-dm-mono uppercase shrink-0"
                style={{
                  background: "var(--ed-ink)",
                  color: "var(--ed-paper)",
                  padding: "12px 22px",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  ...fadeUp(1060),
                }}
              >
                <LangText en="Enter →" es="Entrar →" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== CLOSED COVER (the sealed note you open) ===== */}
      <button
        type="button"
        aria-label="Open the note from the founder"
        onClick={() => !open && setOpen(true)}
        className="absolute inset-0"
        style={{
          border: "none",
          padding: 0,
          background: "transparent",
          cursor: open ? "default" : "pointer",
          transformOrigin: "top center",
          transform: open
            ? "rotateX(-168deg) translateY(-12px)"
            : "rotateX(0deg)",
          opacity: open ? 0 : 1,
          transition: reduced
            ? "none"
            : `transform 640ms ${ease}, opacity 320ms ease 360ms`,
          backfaceVisibility: "hidden",
          pointerEvents: open ? "none" : "auto",
          zIndex: 2,
        }}
      >
        {/* torn paper face of the folded note */}
        <span aria-hidden="true" className="absolute inset-0" style={paperBg} />

        {/* cover contents */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ padding: "30px 28px" }}
        >
          <span
            className="font-dm-mono uppercase absolute"
            style={{
              top: 22,
              left: 26,
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--ed-text-mute)",
            }}
          >
            <LangText en="Fig. 01" es="Fig. 01" />
          </span>

          {/* abstract envelope + pen illustration */}
          <span className="block" style={{ marginBottom: 16, lineHeight: 0 }}>
            <EnvelopePenArt width={150} />
          </span>

          <span
            className="font-caveat block"
            style={{
              fontSize: "clamp(30px, 7vw, 42px)",
              fontWeight: 600,
              color: "var(--ed-rust)",
              lineHeight: 1.05,
              transform: "rotate(-1.5deg)",
              maxWidth: 320,
            }}
          >
            <LangText
              en="A note from the founder"
              es="Una nota de la fundadora"
            />
          </span>

          <span
            className="font-dm-mono uppercase block"
            style={{
              marginTop: 18,
              fontSize: 10,
              letterSpacing: "0.28em",
              color: "var(--ed-text-mute)",
              display: autoUnfold ? "none" : "block",
              animation:
                reduced || autoUnfold
                  ? "none"
                  : "apl-letter-pulse 2.4s ease-in-out infinite",
            }}
          >
            <LangText en="Click to open ↗" es="Toca para abrir ↗" />
          </span>
        </span>
      </button>

      <style>{`
        @keyframes apl-letter-pulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
