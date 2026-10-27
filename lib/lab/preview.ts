// Server-only by convention. The admin-only profile preview: turns the picker's
// query string into a sample profile row, so Gabs can see any card and chart in
// the real profile layout without creating a profile or calling a geocoder.
import { computeChart } from "@/lib/astro";
import { CARDS } from "@/content/lab/cards";
import { toStoredChart } from "./storedChart";
import type { LabProfileRow } from "./types";

/** Fixed birthplaces, so the preview never calls the geocoder. */
export const PREVIEW_PLACES = [
  { key: "madrid", label: "Madrid, España", lat: 40.4168, lon: -3.7038, tz: "Europe/Madrid" },
  { key: "barcelona", label: "Barcelona, España", lat: 41.3874, lon: 2.1686, tz: "Europe/Madrid" },
  { key: "cdmx", label: "Ciudad de México, México", lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  { key: "bogota", label: "Bogotá, Colombia", lat: 4.711, lon: -74.0721, tz: "America/Bogota" },
  { key: "buenos-aires", label: "Buenos Aires, Argentina", lat: -34.6037, lon: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  { key: "london", label: "London, United Kingdom", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  { key: "new-york", label: "New York, United States", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { key: "tromso", label: "Tromsø, Norway (far north)", lat: 69.6492, lon: 18.9553, tz: "Europe/Oslo" },
] as const;

export type PreviewParams = {
  card: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, or null for "no birth time" */
  time: string | null;
  place: (typeof PREVIEW_PLACES)[number];
  /** Show the "open on this device" banner a brand-new visitor sees. */
  banner: boolean;
};

export const PREVIEW_DEFAULTS = { card: "The Tower", date: "1992-03-14", time: "14:30", place: "madrid" } as const;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function realDate(s: string, today: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && s >= "1900-01-01" && s <= today;
}

/**
 * Read the picker's query string. Anything missing or invalid falls back to a
 * default, so a mistyped link still shows a profile. An empty `time` means
 * "no birth time" (Rising locked); a missing one uses the default time.
 * @param now injectable clock for tests
 */
export function parsePreviewParams(q: Record<string, string | string[] | undefined>, now: Date = new Date()): PreviewParams {
  const today = now.toISOString().slice(0, 10);
  const cardIn = one(q.card);
  const card = CARDS.some((c) => c.name === cardIn) ? cardIn! : PREVIEW_DEFAULTS.card;
  const dateIn = one(q.date);
  const date = dateIn && realDate(dateIn, today) ? dateIn : PREVIEW_DEFAULTS.date;
  const timeIn = one(q.time);
  const time = timeIn === undefined ? PREVIEW_DEFAULTS.time : TIME_RE.test(timeIn) ? timeIn : null;
  const place = PREVIEW_PLACES.find((p) => p.key === one(q.place)) ?? PREVIEW_PLACES[0];
  return { card, date, time, place, banner: one(q.banner) === "1" };
}

/** A sample profile row for the preview. Never stored. */
export function previewProfile(p: PreviewParams): LabProfileRow {
  const chart = computeChart({ dateISO: p.date, timeHHMM: p.time, lat: p.place.lat, lon: p.place.lon, zone: p.place.tz });
  return {
    id: "preview",
    user_id: null,
    email: "preview@invalid",
    lead_id: null,
    card_drawn: p.card,
    birth_date: p.date,
    birth_time: p.time ? `${p.time}:00` : null,
    birth_place_text: p.place.label,
    lat: p.place.lat,
    lon: p.place.lon,
    tz: p.place.tz,
    birth_utc: chart.birthUtc.toISOString(),
    positions: toStoredChart(chart),
    src: null,
    consent_at: "",
    consent_text_version: "preview",
    next_transit: null,
    transit_peak_date: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
  };
}
