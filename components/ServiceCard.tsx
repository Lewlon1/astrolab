import Link from "next/link";
import { ServiceCardProps } from "@/types";

export default function ServiceCard({ service }: ServiceCardProps) {
  const isMostPopular = service.tag === "Most popular";
  const isLeadMagnet = service.tag === "Lead magnet";
  const isFree = service.price === 0;

  return (
    <div
      style={{
        background: "white",
        border: isMostPopular
          ? "2px solid var(--gold)"
          : "1px solid rgba(184, 160, 112, 0.3)",
        borderRadius: "16px",
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.04)",
      }}
    >
      {service.tag && (
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "0.25rem 0.75rem",
            borderRadius: "50px",
            background: isMostPopular
              ? "var(--gold-pale)"
              : "var(--cream)",
            color: isMostPopular
              ? "var(--deep-brown)"
              : "var(--text-muted)",
          }}
        >
          {service.tag}
        </span>
      )}

      <h3
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: "1.5rem",
          fontWeight: 400,
          color: "var(--deep-brown)",
          marginTop: service.tag ? "0.75rem" : 0,
          marginBottom: "0.5rem",
        }}
      >
        {service.name}
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "var(--coral)",
          }}
        >
          {service.price_label}
        </span>
        {service.duration && (
          <span style={{ color: "var(--text-light)", fontSize: "0.85rem" }}>
            {service.duration}
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          flex: 1,
          fontWeight: 300,
        }}
      >
        {service.short_description}
      </p>

      <Link
        href={
          isLeadMagnet
            ? "/#lead-capture"
            : service.calendly_url || `/services/${service.slug}`
        }
        className={isFree ? "btn-secondary" : "btn-primary"}
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.85rem",
          padding: "0.75rem 1.5rem",
        }}
      >
        {isFree ? "Get yours free" : "Book session"}
      </Link>
    </div>
  );
}
