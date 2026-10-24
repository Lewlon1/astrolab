"use client";

import { useState, FormEvent } from "react";
import { getSessionKey, getAttribution } from "@/lib/analytics/session";
import { track } from "@/lib/analytics/track";
import { trackLead } from "@/lib/fbpixel";
import { useLang } from "@/context/LangContext";

type Props = {
  /** Where the form is mounted; goes into the analytics event only (not `leads.source`). */
  placement?: "section" | "inline";
};

const COPY = {
  en: {
    success: "You're in! Keep an eye on your inbox for the next letter landing.",
    placeholder: "Your email",
    submit: "Subscribe",
    loading: "Sending...",
    error: "Something went wrong. Please try again.",
  },
  es: {
    success: "¡Ya estás dentro! Está atenta a tu bandeja de entrada: la próxima carta está por llegar.",
    placeholder: "Tu correo electrónico",
    submit: "Suscribirme",
    loading: "Enviando...",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
} as const;

export default function LeadCaptureForm({ placement = "section" }: Props) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    // Attribution so the admin can see who signed up + where they came from.
    const attribution = getAttribution();

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "website_form",
          session_key: getSessionKey(),
          referrer: attribution.referrer,
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.utm_campaign,
          landing_path: attribution.landing_path,
        }),
      });

      if (res.ok) {
        setStatus("success");
        track("conversion", "newsletter_signup", { source: "website_form", placement });
        // Meta Pixel Lead conversion with Advanced Matching (hashed email) so the
        // CAPI Gateway can match it server-side. Consent-gated (no-ops if fbq absent).
        trackLead(email);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || t.error);
        setStatus("error");
      }
    } catch {
      setErrorMessage(t.error);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-gold font-medium">{t.success}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.placeholder}
        required
        className="flex-1 bg-white/5 border border-white/10 rounded-[22px] px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/40 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-gold text-midnight text-sm font-medium px-6 py-2.5 rounded-[22px] hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? t.loading : t.submit}
      </button>
      {status === "error" && (
        <p className="text-coral text-sm sm:absolute sm:mt-12">{errorMessage}</p>
      )}
    </form>
  );
}
