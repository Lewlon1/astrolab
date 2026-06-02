"use client";

import Link from "next/link";
import { useConsent } from "@/context/ConsentContext";
import { useLang } from "@/context/LangContext";

export default function CookieConsentBanner() {
  const { bannerVisible, accept, reject } = useConsent();
  const { lang } = useLang();

  if (!bannerVisible) return null;

  const copy =
    lang === "en"
      ? {
          body:
            "A little cosmic housekeeping ✨ Some cookies simply keep this corner of the internet running. Others — only if you say yes — help us find kindred spirits and remember you next time. Your call, always.",
          learn: "See the full details",
          accept: "Sounds good",
          reject: "No thanks",
          aria: "Cookie consent",
        }
      : {
          body:
            "Un poco de orden cósmico ✨ Algunas cookies simplemente hacen que este rincón de internet funcione. Otras — solo si dices que sí — nos ayudan a encontrar almas afines y a recordarte la próxima vez. Tú decides, siempre.",
          learn: "Ver todos los detalles",
          accept: "Me parece bien",
          reject: "No, gracias",
          aria: "Consentimiento de cookies",
        };

  return (
    <div
      role="dialog"
      aria-label={copy.aria}
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 md:px-6 md:pb-6"
    >
      <div
        className="mx-auto max-w-[1100px] flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
        style={{
          background: "var(--ed-paper)",
          border: "1px solid var(--ed-ink)",
          boxShadow: "0 18px 50px rgba(0,0,0,.22)",
          padding: "18px 20px",
        }}
      >
        <p
          className="font-spectral m-0 flex-1"
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--ed-ink-soft)",
          }}
        >
          {copy.body}{" "}
          <Link
            href="/privacy"
            className="underline hover:opacity-70 transition-opacity"
            style={{ color: "var(--ed-ink)", textUnderlineOffset: "2px" }}
          >
            {copy.learn}
          </Link>
        </p>

        <div className="flex items-center gap-3 shrink-0">
          {/* Reject stays a real one-click, equally-sized option (GDPR), just
              visually quieter so the warm Accept reads as the friendly default. */}
          <button
            type="button"
            onClick={reject}
            className="font-dm-mono uppercase cursor-pointer hover:opacity-100 transition-opacity"
            style={{
              background: "transparent",
              color: "var(--ed-text-mute)",
              border: "1px solid var(--ed-rule)",
              padding: "12px 22px",
              fontSize: 10.5,
              letterSpacing: "0.18em",
              fontWeight: 500,
              opacity: 0.85,
            }}
          >
            {copy.reject}
          </button>
          <button
            type="button"
            onClick={accept}
            className="font-dm-mono uppercase cursor-pointer hover:-translate-y-[1px] transition-transform"
            style={{
              background: "var(--ed-rust)",
              color: "var(--ed-paper)",
              border: "1px solid var(--ed-rust)",
              padding: "12px 28px",
              fontSize: 11,
              letterSpacing: "0.18em",
              fontWeight: 600,
              boxShadow: "0 8px 22px rgba(180,96,68,0.32)",
            }}
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
