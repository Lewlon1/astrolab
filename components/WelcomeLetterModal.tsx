"use client";

import { useEffect } from "react";
import { useLang } from "@/context/LangContext";
import WelcomeLetter from "@/components/WelcomeLetter";

type Props = {
  isOpen: boolean;
  onEnter: () => void;
  /** When true, the note unfolds on its own (opened from the envelope mock-up). */
  autoUnfold?: boolean;
};

export default function WelcomeLetterModal({
  isOpen,
  onEnter,
  autoUnfold = false,
}: Props) {
  const { lang, setLang } = useLang();

  // Body scroll lock + ESC close
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onEnter]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === "en"
          ? "Welcome letter from Gabriela"
          : "Carta de bienvenida de Gabriela"
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onEnter();
      }}
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto px-3 py-4"
      style={{
        background: "rgba(42, 33, 27, 0.62)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "welcome-fade-in .4s ease",
      }}
    >
      <style>{`
        @keyframes welcome-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* in-modal language toggle (top right of viewport) */}
      <div
        className="absolute flex items-center gap-1"
        style={{
          top: 18,
          right: 18,
          zIndex: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setLang("en")}
          className="font-syne"
          style={{
            background: "none",
            border: "none",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: lang === "en" ? "var(--ed-paper)" : "rgba(244,239,230,0.55)",
            textTransform: "uppercase",
            fontWeight: lang === "en" ? 700 : 400,
            borderBottom:
              lang === "en"
                ? "1px solid var(--ed-paper)"
                : "1px solid transparent",
          }}
        >
          EN
        </button>
        <span style={{ color: "rgba(244,239,230,0.55)" }}>·</span>
        <button
          type="button"
          onClick={() => setLang("es")}
          className="font-syne"
          style={{
            background: "none",
            border: "none",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: lang === "es" ? "var(--ed-paper)" : "rgba(244,239,230,0.55)",
            textTransform: "uppercase",
            fontWeight: lang === "es" ? 700 : 400,
            borderBottom:
              lang === "es"
                ? "1px solid var(--ed-paper)"
                : "1px solid transparent",
          }}
        >
          ES
        </button>
      </div>

      <div className="relative flex w-full items-center justify-center">
        <WelcomeLetter onEnter={onEnter} autoUnfold={autoUnfold} />
      </div>
    </div>
  );
}
