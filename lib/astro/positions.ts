// Geocentric apparent ecliptic longitudes (true equinox of date) via
// astronomy-engine (MIT). Mean lunar node from Meeus, Astronomical
// Algorithms ch. 47.

import * as Astronomy from "astronomy-engine";
import { normDeg } from "./signs";
import { BODIES, type Body } from "./types";

/** Mean ascending lunar node, degrees. T = Julian centuries TT since J2000. */
function meanNode(date: Date): number {
  const T = Astronomy.MakeTime(date).tt / 36525;
  return normDeg(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
}

/** Apparent geocentric ecliptic longitude of date for one body, 0–360. */
export function longitudeOf(body: Body, date: Date): number {
  switch (body) {
    case "Sun":
      // Includes aberration and nutation; true ecliptic of date.
      return normDeg(Astronomy.SunPosition(date).elon);
    case "Moon":
      // ECT frame: true ecliptic and equinox of date.
      return normDeg(Astronomy.EclipticGeoMoon(date).lon);
    case "NorthNode":
      return meanNode(date);
    default: {
      // EQJ vector with light-time and aberration, rotated to true ecliptic of date.
      const vec = Astronomy.GeoVector(body as Astronomy.Body, date, true);
      return normDeg(Astronomy.Ecliptic(vec).elon);
    }
  }
}

export function positionsAt(date: Date): Record<Body, number> {
  const out = {} as Record<Body, number>;
  for (const body of BODIES) out[body] = longitudeOf(body, date);
  return out;
}

const HALF_DAY_MS = 12 * 3600_000;

/** True when the body's longitude decreases across date ±12h. */
export function isRetrograde(body: Body, date: Date): boolean {
  const before = longitudeOf(body, new Date(date.getTime() - HALF_DAY_MS));
  const after = longitudeOf(body, new Date(date.getTime() + HALF_DAY_MS));
  const delta = ((after - before + 540) % 360) - 180;
  return delta < 0;
}
