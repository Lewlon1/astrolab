// Server-only by convention. Turns a stored chart into transit seasons for the
// profile page, and the next season into the lab_profiles / MailerLite fields.
// Shared by the profile page, the gate route and the monthly cron.
import { findTransits, type TransitNatal, type TransitSeason } from "@/lib/astro";
import { transitCopy } from "@/content/lab/transits";
import type { StoredChart } from "./types";

/** How far ahead the tracker looks. */
export const TRANSIT_WINDOW_MONTHS = 12;

/**
 * Natal points the transit finder reads. Sun, Moon, Venus and Saturn use the
 * stored longitude (local noon when the time is unknown, even if ambiguous).
 * Rising is null without a birth time: never guessed.
 */
export function natalPointsFromStoredChart(chart: StoredChart): TransitNatal {
  const lon = (body: "Sun" | "Moon" | "Venus" | "Saturn") => {
    const p = chart.positions.find((x) => x.body === body);
    return p && Number.isFinite(p.lon) ? p.lon : null;
  };
  const asc = chart.hasTime && chart.houses ? chart.houses.ascendant : null;
  return {
    Sun: lon("Sun"),
    Moon: lon("Moon"),
    Venus: lon("Venus"),
    Saturn: lon("Saturn"),
    Rising: typeof asc === "number" && Number.isFinite(asc) ? asc : null,
  };
}

/** Seasons overlapping the next TRANSIT_WINDOW_MONTHS from `now`, sorted by peak. */
export function seasonsForChart(chart: StoredChart, now: Date = new Date()): TransitSeason[] {
  const to = new Date(now);
  to.setUTCMonth(to.getUTCMonth() + TRANSIT_WINDOW_MONTHS);
  return findTransits({ natal: natalPointsFromStoredChart(chart), from: now, to });
}

export type NextTransitFields = { next_transit: string | null; transit_peak_date: string | null };

/**
 * The next season as the headline and its peak as YYYY-MM-DD (UTC). Seasons are
 * sorted by peak; prefer the first whose peak is on or after `now` (a season
 * already in orb can have a past peak), falling back to the first season.
 */
export function nextTransitFields(seasons: readonly TransitSeason[], now: Date = new Date()): NextTransitFields {
  const next = seasons.find((s) => s.peak.getTime() >= now.getTime()) ?? seasons[0];
  if (!next) return { next_transit: null, transit_peak_date: null };
  return {
    next_transit: transitCopy(next.planet, next.aspect, next.point).headline,
    transit_peak_date: next.peak.toISOString().slice(0, 10),
  };
}

/** True when a stored row already holds exactly these transit fields. */
export function transitFieldsUnchanged(
  stored: { next_transit?: string | null; transit_peak_date?: string | null },
  next: NextTransitFields,
): boolean {
  return (stored.next_transit ?? null) === next.next_transit && (stored.transit_peak_date ?? null) === next.transit_peak_date;
}

/** JSON-safe season for client props: dates as ISO strings. */
export type SerializedSeason = {
  planet: TransitSeason["planet"];
  aspect: TransitSeason["aspect"];
  point: TransitSeason["point"];
  exactDates: string[];
  start: string;
  end: string;
  peak: string;
};

export function serializeSeasons(seasons: readonly TransitSeason[]): SerializedSeason[] {
  return seasons.map((s) => ({
    planet: s.planet,
    aspect: s.aspect,
    point: s.point,
    exactDates: s.exactDates.map((d) => d.toISOString()),
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    peak: s.peak.toISOString(),
  }));
}
