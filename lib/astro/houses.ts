// Ascendant, MC and house cusps. Placidus (semi-arc iteration) up to
// |lat| 66°, Whole Sign above that or whenever Placidus cannot converge.

import * as Astronomy from "astronomy-engine";
import { normDeg } from "./signs";

export type HouseSystem = "Placidus" | "WholeSign";

export type Houses = {
  system: HouseSystem;
  ascendant: number;
  mc: number;
  /** cusps[0] is house 1 … cusps[11] is house 12. */
  cusps: number[];
};

const RAD = Math.PI / 180;
const PLACIDUS_MAX_LAT = 66;
const MAX_ITER = 100;
const EPS_CONVERGE = 1e-9;

const sin = (d: number) => Math.sin(d * RAD);
const cos = (d: number) => Math.cos(d * RAD);
const atan2d = (y: number, x: number) => Math.atan2(y, x) / RAD;

/** Ecliptic longitude of the ecliptic point with right ascension `ra`. */
function lonFromRa(ra: number, eps: number): number {
  return normDeg(atan2d(sin(ra), cos(ra) * cos(eps)));
}

/**
 * Placidus cusp by fixed-point iteration on right ascension.
 * `above` cusps (11, 12) sit `f` of the diurnal semi-arc east of the MC;
 * below-horizon cusps (2, 3) sit `f` of the nocturnal semi-arc west of the IC.
 * Returns null if the point is circumpolar or the loop fails to converge.
 */
function placidusCusp(ramc: number, lat: number, eps: number, f: number, above: boolean): number | null {
  const tanLat = Math.tan(lat * RAD);
  let ra = above ? ramc + f * 90 : ramc + 180 - f * 90;
  for (let i = 0; i < MAX_ITER; i++) {
    const lon = lonFromRa(ra, eps);
    const decl = Math.asin(sin(eps) * sin(lon));
    const x = -tanLat * Math.tan(decl);
    if (x < -1 || x > 1) return null;
    const dsa = Math.acos(x) / RAD;
    const next = above ? ramc + f * dsa : ramc + 180 - f * (180 - dsa);
    if (Math.abs(next - ra) < EPS_CONVERGE) return lonFromRa(next, eps);
    ra = next;
  }
  return null;
}

function wholeSign(ascendant: number): number[] {
  const first = Math.floor(ascendant / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => normDeg(first + 30 * i));
}

export function computeHouses(utc: Date, lat: number, lon: number): Houses {
  const time = Astronomy.MakeTime(utc);
  const eps = Astronomy.e_tilt(time).tobl; // true obliquity of date
  const ramc = normDeg(Astronomy.SiderealTime(time) * 15 + lon); // local apparent sidereal time

  const mc = normDeg(atan2d(sin(ramc), cos(ramc) * cos(eps)));
  // Equivalent to the brief's atan2(−cos RAMC, sin RAMC·cos ε + tan φ·sin ε)
  // rotated 180° so it lands on the eastern horizon, not the descendant.
  let ascendant = normDeg(
    atan2d(cos(ramc), -(sin(ramc) * cos(eps) + Math.tan(lat * RAD) * sin(eps))),
  );
  // Guard: the ASC must lie 0–180° ahead of the MC.
  if (normDeg(ascendant - mc) >= 180) ascendant = normDeg(ascendant + 180);

  if (Math.abs(lat) <= PLACIDUS_MAX_LAT) {
    const c11 = placidusCusp(ramc, lat, eps, 1 / 3, true);
    const c12 = placidusCusp(ramc, lat, eps, 2 / 3, true);
    const c2 = placidusCusp(ramc, lat, eps, 2 / 3, false);
    const c3 = placidusCusp(ramc, lat, eps, 1 / 3, false);
    if (c11 !== null && c12 !== null && c2 !== null && c3 !== null) {
      const half = [ascendant, c2, c3, normDeg(mc + 180), normDeg(c11 + 180), normDeg(c12 + 180)];
      return {
        system: "Placidus",
        ascendant,
        mc,
        cusps: [...half, ...half.map((c) => normDeg(c + 180))],
      };
    }
  }
  return { system: "WholeSign", ascendant, mc, cusps: wholeSign(ascendant) };
}

/** House number 1–12 containing `lon`, given 12 cusps (house 1 first). */
export function houseOf(lon: number, cusps: number[]): number {
  const x = normDeg(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const span = normDeg(cusps[(i + 1) % 12] - start);
    if (normDeg(x - start) < span) return i + 1;
  }
  return 1; // unreachable for well-formed cusps
}
