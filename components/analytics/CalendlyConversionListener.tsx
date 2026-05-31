"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

/**
 * Captures CONFIRMED Calendly bookings for free, client-side.
 *
 * Calendly's embed (inline widget on /book, plus any popup) postMessages
 * `calendly.event_scheduled` to the parent window when a booking completes.
 * We record it as a `booking_confirmed` conversion. No paid Calendly API or
 * webhook required. Mounted once in the public layout so it covers every embed.
 */
export default function CalendlyConversionListener() {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://calendly.com") return;
      const data = e.data as { event?: string } | null;
      if (data && typeof data === "object" && data.event === "calendly.event_scheduled") {
        track("conversion", "booking_confirmed", { via: "calendly_widget" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
