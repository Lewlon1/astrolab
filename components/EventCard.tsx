import Link from "next/link";
import { eventJsonLd } from "@/lib/jsonld";
import { EventCardProps } from "@/types";

const EVENT_TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  workshop: { bg: "rgba(212,112,74,0.2)", color: "var(--coral)" },
  cosmic_tasters: { bg: "rgba(232,168,56,0.25)", color: "var(--deep-brown)" },
  collab: { bg: "rgba(122,155,106,0.25)", color: "var(--forest)" },
  popup: { bg: "rgba(184,160,112,0.25)", color: "var(--sage)" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  cosmic_tasters: "Cosmic Tasters",
  collab: "Collaboration",
  popup: "Pop-up",
};

export default function EventCard({ event }: EventCardProps) {
  const typeStyle = event.event_type
    ? EVENT_TYPE_STYLES[event.event_type] ?? {
        bg: "var(--cream)",
        color: "var(--text-muted)",
      }
    : { bg: "var(--cream)", color: "var(--text-muted)" };

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
    <div
      style={{
        background: "white",
        border: "1px solid rgba(184,160,112,0.3)",
        borderRadius: "16px",
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event)),
        }}
      />

      {typeLabel && (
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0.25rem 0.75rem",
            borderRadius: "50px",
            background: typeStyle.bg,
            color: typeStyle.color,
          }}
        >
          {typeLabel}
        </span>
      )}

      <h3
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: "1.5rem",
          fontWeight: 400,
          color: "var(--deep-brown)",
          marginTop: typeLabel ? "1rem" : 0,
        }}
      >
        {event.title}
      </h3>

      {formattedDate && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "0.5rem",
          }}
        >
          {formattedDate}
        </p>
      )}

      {event.location && (
        <p
          style={{
            color: "var(--text-light)",
            fontSize: "0.8rem",
            marginTop: "0.25rem",
          }}
        >
          {event.location}
        </p>
      )}

      {event.price_label && (
        <p
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: "1.15rem",
            color: "var(--coral)",
            marginTop: "0.75rem",
          }}
        >
          {event.price_label}
        </p>
      )}

      {event.description && (
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            marginTop: "0.75rem",
            flex: 1,
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          {event.description}
        </p>
      )}

      <Link
        href={event.eventbrite_url || `/events/${event.slug}`}
        className={event.price === 0 ? "btn-secondary" : "btn-primary"}
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.85rem",
          padding: "0.75rem 1.5rem",
        }}
      >
        {event.price === 0 ? "Register free" : "Get tickets"}
      </Link>
    </div>
  );
}
