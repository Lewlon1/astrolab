"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { track } from "@/lib/analytics/track";

/**
 * Captures CONFIRMED bookings client-side, for free.
 *
 * Cal.com's embed fires a `bookingSuccessful` event on the parent window when a
 * booking completes; we record it as a `booking_confirmed` conversion. Stripe
 * Payment Link payments complete off-site and are not captured here (that would
 * need a Stripe webhook — Phase 2). Mounted once in the public layout.
 */
export default function BookingConversionListener() {
  useEffect(() => {
    let cal: Awaited<ReturnType<typeof getCalApi>> | undefined;
    const onBooking = () => {
      track("conversion", "booking_confirmed", { via: "cal_embed" });
    };
    (async () => {
      cal = await getCalApi();
      cal("on", { action: "bookingSuccessful", callback: onBooking });
    })();
    return () => {
      cal?.("off", { action: "bookingSuccessful", callback: onBooking });
    };
  }, []);

  return null;
}
