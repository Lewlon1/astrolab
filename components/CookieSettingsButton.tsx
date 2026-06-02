"use client";

import { useConsent } from "@/context/ConsentContext";
import { useLang } from "@/context/LangContext";

/**
 * Footer entry point so visitors can change or withdraw their cookie choice at
 * any time (GDPR: withdrawing consent must be as easy as giving it).
 */
export default function CookieSettingsButton() {
  const { openSettings } = useConsent();
  const { lang } = useLang();

  return (
    <button
      type="button"
      onClick={openSettings}
      className="font-dm-mono uppercase cursor-pointer hover:opacity-70 transition-opacity"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        color: "inherit",
        font: "inherit",
        fontSize: "inherit",
        letterSpacing: "inherit",
        textTransform: "inherit",
      }}
    >
      {lang === "en" ? "Cookie Settings" : "Configurar Cookies"}
    </button>
  );
}
