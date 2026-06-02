"use client";

import { useState, FormEvent } from "react";
import { getSessionKey, getAttribution } from "@/lib/analytics/session";
import { track } from "@/lib/analytics/track";
import { trackLead } from "@/lib/fbpixel";

export default function LeadCaptureForm() {
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
        track("conversion", "newsletter_signup", { source: "website_form" });
        // Meta Pixel Lead conversion with Advanced Matching (hashed email) so the
        // CAPI Gateway can match it server-side. Consent-gated (no-ops if fbq absent).
        trackLead(email);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-gold font-medium">
        You&apos;re in! Check your DMs for your free Love &amp; Career Code.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
        className="flex-1 bg-white/5 border border-white/10 rounded-[22px] px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/40 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-gold text-midnight text-sm font-medium px-6 py-2.5 rounded-[22px] hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Get my free code"}
      </button>
      {status === "error" && (
        <p className="text-coral text-sm sm:absolute sm:mt-12">{errorMessage}</p>
      )}
    </form>
  );
}
