// Outer-planet transits to natal points. Scans daily, finds exact hits by
// bisecting zero crossings of the signed separation, and groups the passes of
// one retrograde cycle into a single "season".

import { ASPECTS, type AspectType } from "./aspects";
import { longitudeOf } from "./positions";
import type { Body } from "./types";

export type TransitBody = Extract<Body, "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto">;
export type NatalPoint = "Sun" | "Moon" | "Rising" | "Venus" | "Saturn";
export type TransitAspectType = Exclude<AspectType, "sextile">;

/** Natal longitudes by point; null skips the point (Rising without a birth time). */
export type TransitNatal = Record<NatalPoint, number | null>;

export type TransitSeason = {
  planet: TransitBody;
  aspect: TransitAspectType;
  point: NatalPoint;
  /** Every exact hit in the season, ascending (one per retrograde pass). */
  exactDates: Date[];
  /** When the separation first comes within the orb. */
  start: Date;
  /** When it last leaves the orb. */
  end: Date;
  /** First exact date on or after `from`, or the last exact date if none is. */
  peak: Date;
};

export type FindTransitsOptions = {
  natal: TransitNatal;
  from: Date;
  to: Date;
  planets?: readonly TransitBody[];
  aspects?: readonly TransitAspectType[];
  /** Degrees either side of exact. */
  orb?: number;
};

export const TRANSIT_BODIES: readonly TransitBody[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
export const TRANSIT_ASPECT_TYPES: readonly TransitAspectType[] = ["conjunction", "square", "opposition", "trine"];
const NATAL_POINTS: readonly NatalPoint[] = ["Sun", "Moon", "Rising", "Venus", "Saturn"];

/** Tie-break weight when two seasons peak together: slower planets first. */
export const PLANET_WEIGHT: Record<TransitBody, number> = { Pluto: 5, Neptune: 4, Uranus: 3, Saturn: 2, Jupiter: 1 };

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
/** Scan margin either side of the window, so a whole retrograde season around it is captured. */
const MARGIN_DAYS = 400;
/** Hits closer than this belong to the same season (retrograde passes). */
const SEASON_GAP_MS = 300 * DAY_MS;
/** A sign change only counts as a crossing near zero, not across the ±180 wrap. */
const CROSSING_LIMIT = 10;

/** Signed separation a − b, normalised to (−180, 180]. */
function signedSep(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/** Target longitudes for an aspect: one for conjunction and opposition, two for square and trine. */
function targetsFor(natal: number, aspect: TransitAspectType): number[] {
  const angle = ASPECTS[aspect];
  if (angle === 0 || angle === 180) return [natal + angle];
  return [natal + angle, natal - angle];
}

/** Bisect [lo, hi] (ms) until it is under an hour wide; `f` changes sign across it. */
function bisect(lo: number, hi: number, f: (t: number) => number): number {
  let flo = f(lo);
  while (hi - lo > HOUR_MS) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if ((flo <= 0 && fm <= 0) || (flo > 0 && fm > 0)) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

type Window = { start: number; end: number };

/**
 * Every transit season (outer planet × aspect × natal point) whose orb window
 * overlaps [from, to], sorted by peak, ties broken by planet weight.
 */
export function findTransits({
  natal,
  from,
  to,
  planets = TRANSIT_BODIES,
  aspects = TRANSIT_ASPECT_TYPES,
  orb = 1,
}: FindTransitsOptions): TransitSeason[] {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const scanStart = fromMs - MARGIN_DAYS * DAY_MS;
  const days = Math.ceil((toMs + MARGIN_DAYS * DAY_MS - scanStart) / DAY_MS) + 1;
  const times = Array.from({ length: days }, (_, i) => scanStart + i * DAY_MS);

  const points = NATAL_POINTS.filter((p) => typeof natal[p] === "number" && Number.isFinite(natal[p]));
  const seasons: TransitSeason[] = [];

  for (const planet of planets) {
    // One longitude per planet per day, shared by every aspect and point.
    const lons = times.map((t) => longitudeOf(planet, new Date(t)));
    const lonAt = (t: number) => longitudeOf(planet, new Date(t));

    for (const point of points) {
      const natalLon = natal[point] as number;
      for (const aspect of aspects) {
        for (const target of targetsFor(natalLon, aspect)) {
          const sep = lons.map((l) => signedSep(l, target));
          const sepAt = (t: number) => signedSep(lonAt(t), target);

          // Exact hits: zero crossings between consecutive days.
          const hits: number[] = [];
          for (let i = 0; i + 1 < days; i++) {
            const s0 = sep[i];
            const s1 = sep[i + 1];
            if (Math.abs(s0) >= CROSSING_LIMIT || Math.abs(s1) >= CROSSING_LIMIT) continue;
            if ((s0 <= 0 && s1 > 0) || (s0 >= 0 && s1 < 0)) hits.push(bisect(times[i], times[i + 1], sepAt));
          }
          if (hits.length === 0) continue;

          // Orb windows: runs of days within the orb, edges refined to the hour.
          const inOrb = (t: number) => Math.abs(sepAt(t)) - orb;
          const windows: Window[] = [];
          for (let i = 0; i < days; i++) {
            if (Math.abs(sep[i]) > orb) continue;
            let j = i;
            while (j + 1 < days && Math.abs(sep[j + 1]) <= orb) j++;
            const start = i > 0 ? bisect(times[i - 1], times[i], inOrb) : times[i];
            const end = j + 1 < days ? bisect(times[j], times[j + 1], inOrb) : times[j];
            windows.push({ start, end });
            i = j;
          }

          // Group hits into seasons (passes within 300 days of the previous one).
          const groups: number[][] = [];
          for (const h of hits) {
            const last = groups[groups.length - 1];
            if (last && h - last[last.length - 1] <= SEASON_GAP_MS) last.push(h);
            else groups.push([h]);
          }

          for (const g of groups) {
            let start = g[0];
            let end = g[g.length - 1];
            for (const w of windows) {
              if (g.some((h) => h >= w.start - HOUR_MS && h <= w.end + HOUR_MS)) {
                start = Math.min(start, w.start);
                end = Math.max(end, w.end);
              }
            }
            if (end < fromMs || start > toMs) continue;
            const peak = g.find((h) => h >= fromMs) ?? g[g.length - 1];
            seasons.push({
              planet,
              aspect,
              point,
              exactDates: g.map((h) => new Date(h)),
              start: new Date(start),
              end: new Date(end),
              peak: new Date(peak),
            });
          }
        }
      }
    }
  }

  return seasons.sort(
    (a, b) => a.peak.getTime() - b.peak.getTime() || PLANET_WEIGHT[b.planet] - PLANET_WEIGHT[a.planet],
  );
}
