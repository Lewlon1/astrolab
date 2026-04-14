"use client";

import { useState } from "react";
import EventCard from "@/components/EventCard";
import type { Event } from "@/types";

export default function PastEventsSection({ events }: { events: Event[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.75rem",
            fontWeight: 400,
            color: "var(--deep-brown)",
            margin: 0,
          }}
        >
          Past events
        </h2>
        <span
          style={{
            color: "var(--gold)",
            fontSize: "0.9rem",
            transition: "transform 0.3s",
            transform: isOpen ? "rotate(180deg)" : undefined,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            marginTop: "2rem",
          }}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
