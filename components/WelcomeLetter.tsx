"use client";

import { useEffect, useState } from "react";
import LangText from "@/components/LangText";

// TODO: replace with Spanish translation from Lewis
const BODY_S1_EN =
  "A space created for the astro-curious, the career-driven, and those devoted to personal growth and deeper self-understanding.";
const BODY_S2_EN =
  "Astro Psyche Lab blends astrology and psychology to offer clarity, affirmation, and insight in a world that can often feel overwhelming and uncertain.";
const BODY_S3_EN =
  "Through cosmic perspective and emotional awareness, the Lab exists to help you reconnect with your authentic self and better understand the patterns shaping your journey.";

const BODY_S1_ES = BODY_S1_EN;
const BODY_S2_ES = BODY_S2_EN;
const BODY_S3_ES = BODY_S3_EN;

export default function WelcomeLetter() {
  const [unsealed, setUnsealed] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setUnsealed(true);
      return;
    }
    const t = window.setTimeout(() => setUnsealed(true), 300);
    return () => window.clearTimeout(t);
  }, []);

  const fadeUp = (delayMs: number) => ({
    opacity: unsealed ? 1 : 0,
    transform: unsealed ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 700ms ease ${delayMs}ms, transform 700ms ease ${delayMs}ms`,
  });

  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: 460,
        transform: "rotate(-0.5deg)",
        perspective: 1200,
      }}
    >
      {/* dateline */}
      <div
        className="font-dm-mono uppercase mb-3 flex justify-between items-baseline"
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "var(--ed-text-mute)",
        }}
      >
        <span>
          <LangText en="Fig. 01 · A Letter" es="Fig. 01 · Una Carta" />
        </span>
        <span style={{ color: "var(--ed-rust)" }}>
          <LangText en="From the Lab" es="Desde el Lab" />
        </span>
      </div>

      {/* paper */}
      <div
        className="relative"
        style={{
          background: "var(--ed-paper-deep)",
          padding: "34px 30px 30px",
          border: "1px solid rgba(58,42,28,.14)",
          boxShadow:
            "0 28px 56px -20px rgba(58,42,28,.35), inset 0 0 0 1px rgba(245,237,226,.7)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* sealed flap — covers paper until unsealed */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--ed-paper) 0%, var(--ed-paper-deep) 100%)",
            boxShadow:
              "0 8px 24px -8px rgba(58,42,28,.35), inset 0 -1px 0 rgba(58,42,28,.08)",
            transformOrigin: "top center",
            transform: unsealed
              ? "rotateX(-178deg) translateY(-12px)"
              : "rotateX(0deg) translateY(0)",
            opacity: unsealed ? 0 : 1,
            transition:
              "transform 1100ms cubic-bezier(.6,.05,.2,1) 500ms, opacity 500ms ease 1300ms",
            backfaceVisibility: "hidden",
            zIndex: 2,
            pointerEvents: unsealed ? "none" : "auto",
          }}
        >
          {/* fold line near the bottom of the flap, suggesting it's a flap */}
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 18,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(58,42,28,.18), transparent)",
            }}
          />
          {/* wax seal */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 58,
              height: 58,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 32% 30%, #c45a3a 0%, #8a3a22 55%, #4a1d10 100%)",
              boxShadow:
                "inset 0 -5px 10px rgba(0,0,0,.45), inset 0 2px 4px rgba(255,200,170,.25), 0 4px 10px rgba(58,42,28,.35)",
              transform: unsealed
                ? "translate(-50%, -140%) rotate(-28deg) scale(.85)"
                : "translate(-50%, -50%) rotate(0deg) scale(1)",
              opacity: unsealed ? 0 : 1,
              transition:
                "transform 700ms cubic-bezier(.6,.05,.2,1) 100ms, opacity 500ms ease 350ms",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
            }}
          >
            <span
              className="font-fraunces"
              style={{
                fontStyle: "italic",
                fontSize: 26,
                fontWeight: 400,
                color: "rgba(245,237,226,.88)",
                textShadow: "0 1px 1px rgba(0,0,0,.4)",
                lineHeight: 1,
                transform: "translateY(-1px)",
              }}
            >
              G
            </span>
          </div>
        </div>

        {/* letter content (under the flap) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h3
            className="font-fraunces m-0"
            style={{
              fontStyle: "italic",
              fontSize: 30,
              fontWeight: 400,
              color: "var(--ed-rust)",
              lineHeight: 1,
              marginBottom: 18,
              letterSpacing: "-0.01em",
              ...fadeUp(1300),
            }}
          >
            <LangText
              en="Welcome to the Lab."
              es="Bienvenida al Lab."
            />
          </h3>
          <p
            className="font-spectral m-0"
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "var(--ed-ink-soft)",
              fontWeight: 400,
            }}
          >
            <span style={{ display: "inline-block", ...fadeUp(1700) }}>
              <LangText en={BODY_S1_EN} es={BODY_S1_ES} />{" "}
            </span>
            <span style={{ display: "inline-block", ...fadeUp(1950) }}>
              <LangText en={BODY_S2_EN} es={BODY_S2_ES} />{" "}
            </span>
            <span style={{ display: "inline-block", ...fadeUp(2200) }}>
              <LangText en={BODY_S3_EN} es={BODY_S3_ES} />
            </span>
          </p>
          <div
            className="font-instrument mt-5"
            style={{
              fontStyle: "italic",
              fontSize: 18,
              color: "var(--ed-ink-soft)",
              ...fadeUp(2500),
            }}
          >
            — <LangText en="Gabriela" es="Gabriela" />
          </div>
        </div>
      </div>
    </div>
  );
}
