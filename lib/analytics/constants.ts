// Shared constants for the first-party analytics client.

/** Ephemeral session id — sessionStorage so it dies when the tab closes (cookieless). */
export const SESSION_KEY_STORAGE = "apl.an.sid";
/** Flag so `session_start` fires at most once per session. */
export const SESSION_STARTED_FLAG = "apl.an.started";

export const INGEST_ENDPOINT = "/api/analytics";

/** Flush the queue once it reaches this many events… */
export const FLUSH_MAX_EVENTS = 15;
/** …or after this long, whichever comes first. */
export const FLUSH_INTERVAL_MS = 10_000;
/** Hard cap per request — keeps payloads under the ~64KB sendBeacon limit and
 *  matches the server-side validation in /api/analytics. */
export const MAX_BATCH_EVENTS = 50;

/** Ignore sub-half-second section glimpses (scroll/flip thrash). */
export const MIN_DWELL_MS = 500;

/** Landing-page sections, in scroll order. */
export const SECTION_ORDER = [
  "hero",
  "jung",
  "founder",
  "tarot",
  "magazine",
  "services_index",
  "testimonials",
  "lead_capture",
  "blog",
  "home_cta",
] as const;
