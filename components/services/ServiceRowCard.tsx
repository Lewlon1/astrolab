"use client";

import Link from "next/link";
import Image from "next/image";
import BookAction from "@/components/booking/BookAction";
import type { LocalizedService } from "@/lib/services";

type Props = {
  item: LocalizedService;
  /** 1-based position, rendered as the mono "01" marker. */
  index?: number;
  /** Pre-localized labels so this card needs no LangProvider (admin preview). */
  labels: { book: string; free: string };
  /** Hairline divider on the right edge (grid interior cells). */
  showDivider?: boolean;
  /** Extra left padding for non-first grid columns. */
  inset?: boolean;
};

const ctaStyle = {
  fontSize: 11,
  letterSpacing: "0.22em",
  color: "var(--ed-rust)",
  textDecoration: "none",
  borderBottom: "1px solid var(--ed-rust)",
  paddingBottom: 2,
} as const;

export default function ServiceRowCard({
  item,
  index,
  labels,
  showDivider,
  inset,
}: Props) {
  const ctaLabel = item.isFree ? labels.free : labels.book;

  return (
    <div
      className="flex flex-col"
      style={{
        padding: "32px 28px 32px 0",
        paddingLeft: inset ? 28 : 0,
        borderRight: showDivider ? "1px solid var(--ed-rule)" : "none",
        borderBottom: "1px solid var(--ed-rule)",
      }}
    >
      {item.imageUrl && (
        <div
          className="mb-5"
          style={{
            position: "relative",
            aspectRatio: "3 / 2",
            overflow: "hidden",
          }}
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      <div
        className="font-dm-mono uppercase mb-4"
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "var(--ed-rust)",
        }}
      >
        {index != null && (
          <span style={{ color: "var(--ed-text-mute)" }}>
            {String(index).padStart(2, "0")}
            {item.tag ? " · " : ""}
          </span>
        )}
        {item.tag}
      </div>

      <h4
        className="font-fraunces m-0 mb-4"
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: "var(--ed-ink)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}
      >
        {item.name}
      </h4>

      {item.shortDescription && (
        <p
          className="font-spectral m-0 mb-5"
          style={{
            fontSize: 15,
            color: "var(--ed-ink-soft)",
            lineHeight: 1.65,
            flex: 1,
          }}
        >
          {item.shortDescription}
        </p>
      )}

      <div
        className="font-dm-mono uppercase mb-5"
        style={{
          fontSize: 10,
          color: "var(--ed-text-mute)",
          letterSpacing: "0.12em",
        }}
      >
        {item.priceLabel}
        {item.priceLabel && item.duration ? " · " : ""}
        {item.duration}
      </div>

      <div className="font-dm-mono uppercase mt-auto">
        {item.cta.kind === "booking" && (
          <BookAction
            target={item.cta.target}
            label={ctaLabel}
            analyticsName="cta_book_card"
            conversionName="booking_click"
            serviceSlug={item.slug}
            style={{ ...ctaStyle, background: "none", cursor: "pointer" }}
          />
        )}
        {item.cta.kind === "external" && (
          <a
            href={item.cta.url}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="cta_book_card"
            data-analytics-conversion="booking_click"
            data-service-slug={item.slug}
            style={ctaStyle}
          >
            {ctaLabel}
          </a>
        )}
        {item.cta.kind === "lead" && (
          <Link
            href="/#lead-capture"
            data-analytics="cta_lead_magnet"
            data-service-slug={item.slug}
            style={ctaStyle}
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
