"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { CAL_BRAND } from "@/lib/booking";

type Props = {
  link: string;
  label: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Optional analytics pass-through (picked up by the delegated click listener). */
  analyticsName?: string;
  conversionName?: string;
  serviceSlug?: string;
};

export default function CalBookButton({
  link,
  label,
  className,
  style,
  analyticsName,
  conversionName,
  serviceSlug,
}: Props) {
  useEffect(() => {
    (async () => {
      // @calcom/embed-react 1.5.3 — modern UI-config shape (cssVarsPerTheme).
      // Docs: https://cal.com/docs/core-features/embed
      const cal = await getCalApi();
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": CAL_BRAND },
          dark: { "cal-brand": CAL_BRAND },
        },
        layout: "month_view",
        theme: "light",
      });
    })();
  }, []);

  return (
    <button
      type="button"
      data-cal-link={link}
      data-cal-config='{"layout":"month_view"}'
      data-analytics={analyticsName}
      data-analytics-conversion={conversionName}
      data-service-slug={serviceSlug}
      className={className}
      style={style}
    >
      {label}
    </button>
  );
}
