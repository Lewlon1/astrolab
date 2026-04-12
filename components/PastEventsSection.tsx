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
        className="flex items-center gap-3 group"
      >
        <h2 className="font-heading text-2xl group-hover:text-gold/80 transition-colors">
          Past events
        </h2>
        <span
          className={`text-cream/30 text-sm transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-6 mt-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
