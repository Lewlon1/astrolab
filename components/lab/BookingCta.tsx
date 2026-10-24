"use client";

// Booking link. The click event is fire-and-forget (keepalive) so it never blocks navigation.
import { BOOKING_CTA, BOOKING_URL, PROFILE_EXTRA } from "@/content/lab/ui";
import { BTN_LIGHT } from "./classes";

export default function BookingCta() {
  function onClick() {
    try {
      void fetch("/api/lab/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lab_booking_clicked" }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking must never block the booking link.
    }
  }

  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={BTN_LIGHT}
      aria-describedby="lab-booking-note"
    >
      {BOOKING_CTA.button}
      <span id="lab-booking-note" className="sr-only">
        {PROFILE_EXTRA.bookingNote}
      </span>
    </a>
  );
}
