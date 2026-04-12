import Link from "next/link";
import { eventJsonLd } from "@/lib/jsonld";
import { EventCardProps } from "@/types";

const EVENT_TYPE_STYLES: Record<string, string> = {
  workshop: "bg-ocean/10 text-ocean",
  cosmic_tasters: "bg-coral/10 text-coral",
  collab: "bg-sage/10 text-sage",
  popup: "bg-gold/10 text-gold",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  cosmic_tasters: "Cosmic Tasters",
  collab: "Collaboration",
  popup: "Pop-up",
};

export default function EventCard({ event }: EventCardProps) {
  const typeStyle = event.event_type
    ? EVENT_TYPE_STYLES[event.event_type] ?? "bg-white/5 text-cream/50"
    : "bg-white/5 text-cream/50";

  const typeLabel = event.event_type
    ? EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
    : null;

  const formattedDate = event.date
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(event.date))
    : null;

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event)),
        }}
      />

      {typeLabel && (
        <span
          className={`self-start text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeStyle}`}
        >
          {typeLabel}
        </span>
      )}

      <h3 className="font-heading text-xl mt-4">{event.title}</h3>

      {formattedDate && (
        <p className="text-cream/50 text-sm mt-2">{formattedDate}</p>
      )}

      {event.location && (
        <p className="text-cream/40 text-sm mt-1">{event.location}</p>
      )}

      {event.price_label && (
        <p className="text-cream text-lg mt-3">{event.price_label}</p>
      )}

      {event.description && (
        <p className="text-sm text-cream/50 mt-2 line-clamp-3 flex-1">
          {event.description}
        </p>
      )}

      <Link
        href={event.eventbrite_url || `/events/${event.slug}`}
        className="mt-6 inline-flex items-center justify-center text-sm font-medium rounded-[22px] px-5 py-2.5 border border-cream/20 text-cream hover:border-cream/40 transition-colors"
      >
        {event.price === 0 ? "Register free" : "Get tickets"}
      </Link>
    </div>
  );
}
