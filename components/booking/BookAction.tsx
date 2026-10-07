"use client";

import type { CSSProperties, ReactNode } from "react";
import CalBookButton from "./CalBookButton";
import { calPathFor, type BookingTarget } from "@/lib/booking";

type Props = {
  target: BookingTarget;
  label: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Optional analytics pass-through (picked up by the delegated click listener). */
  analyticsName?: string;
  conversionName?: string;
  serviceSlug?: string;
  /** Where the CTA sits ("tarot" | "grid"), so conversions can be split by surface. */
  placement?: "tarot" | "grid";
};

export default function BookAction({
  target,
  label,
  className,
  style,
  analyticsName,
  conversionName,
  serviceSlug,
  placement,
}: Props) {
  if (target.kind === "cal") {
    return (
      <CalBookButton
        link={calPathFor(target)}
        label={label}
        className={className}
        style={style}
        analyticsName={analyticsName}
        conversionName={conversionName}
        serviceSlug={serviceSlug}
        placement={placement}
        paymentUrl={target.paymentUrl}
      />
    );
  }

  // Stripe Payment Link — opens checkout in a new tab to preserve site context.
  return (
    <a
      href={target.url}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics={analyticsName}
      data-analytics-conversion={conversionName}
      data-service-slug={serviceSlug}
      data-placement={placement}
      className={className}
      style={style}
    >
      {label}
    </a>
  );
}
