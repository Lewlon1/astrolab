import type { AnalyticsEventInput, AnalyticsEventType } from "@/types";
import { enqueue, flush, setAttribution } from "./queue";
import { getAttribution, markSessionStarted } from "./session";

type Extra = Partial<Pick<AnalyticsEventInput, "path" | "section" | "dwell_ms">>;

/** Low-level event emitter. Safe to call anywhere — no-ops on the server. */
export function track(
  event_type: AnalyticsEventType,
  event_name?: string,
  props?: Record<string, unknown>,
  extra?: Extra
): void {
  if (typeof window === "undefined") return;
  enqueue({
    event_type,
    event_name,
    props,
    occurred_at: Date.now(),
    ...extra,
  });
}

export function trackPageView(path: string): void {
  track("page_view", "page_view", undefined, { path });
}

/** Fires `session_start` (and registers attribution) at most once per session. */
export function ensureSessionStarted(): void {
  if (!markSessionStarted()) return;
  const attr = getAttribution();
  setAttribution(attr);
  track("session_start", "session_start", {
    referrer: attr.referrer,
    referrer_host: attr.referrer_host,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    device: attr.device,
    lang: attr.lang,
    landing_path: attr.landing_path,
  });
}

export function trackSectionView(section: string, orderIndex: number): void {
  track("section_view", section, { order_index: orderIndex }, { section });
}

export function trackSectionDwell(
  section: string,
  dwellMs: number,
  orderIndex: number
): void {
  track(
    "section_dwell",
    section,
    { order_index: orderIndex },
    { section, dwell_ms: Math.round(dwellMs) }
  );
}

export function trackSessionEnd(durationMs: number, maxScrollPct: number): void {
  track("session_end", "session_end", {
    duration_ms: Math.round(durationMs),
    max_scroll_pct: maxScrollPct,
  });
}

export { flush };
