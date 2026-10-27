"use client";

// Booking link. The click event is fire-and-forget (keepalive) so it never blocks
// navigation. `service` and `placement` say which offer and which button converted.
import { useId } from "react";
import { PROFILE_EXTRA } from "@/content/lab/ui";
import { BTN, BTN_LIGHT, cx } from "./classes";

type Props = {
  href: string;
  label: string;
  /** services.slug of the offer, if the link is for one. */
  service?: string;
  /** Where the button sits on the profile. */
  placement: "chart" | "transits" | "offers";
  variant?: "primary" | "secondary";
  className?: string;
  /** False on the admin preview, so test clicks never reach the funnel numbers. */
  track?: boolean;
};

const BTN_OUTLINE = cx(
  BTN,
  "border-deepBrown bg-transparent text-deepBrown hover:border-coral2 hover:text-coral2 focus-visible:outline-coral2",
);

export default function BookingCta({ href, label, service, placement, variant = "primary", className, track = true }: Props) {
  const noteId = useId();

  function onClick() {
    if (!track) return;
    try {
      void fetch("/api/lab/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lab_booking_clicked", service, placement }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking must never block the booking link.
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cx(variant === "primary" ? BTN_LIGHT : BTN_OUTLINE, "text-center leading-snug", className)}
      aria-describedby={noteId}
    >
      {label}
      <span id={noteId} className="sr-only">
        {PROFILE_EXTRA.bookingNote}
      </span>
    </a>
  );
}
