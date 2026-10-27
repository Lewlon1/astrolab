import { describe, expect, it } from "vitest";
import { computeHouses, houseOf } from "@/lib/astro/houses";

const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
// Mean obliquity at J2000 (IAU 1980); true obliquity differs by < 0.003°.
const EPS = 23.4392911;

/** Ecliptic longitude of the ecliptic point with right ascension `ra`. */
const lonFromRa = (ra: number) =>
  norm(Math.atan2(Math.sin(ra * RAD), Math.cos(ra * RAD) * Math.cos(EPS * RAD)) / RAD);
/** Right ascension of the ecliptic point at longitude `lon`. */
const raFromLon = (lon: number) =>
  norm(Math.atan2(Math.sin(lon * RAD) * Math.cos(EPS * RAD), Math.cos(lon * RAD)) / RAD);
/** IAU 1982 GMST in degrees — independent of astronomy-engine. */
const gmstDeg = (d: Date) => {
  const days = d.getTime() / 86400_000 + 2440587.5 - 2451545.0;
  return norm(280.46061837 + 360.98564736629 * days);
};
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("computeHouses — angles", () => {
  it("2000-01-01 12:00 UTC at 0,0: MC matches the RAMC-derived value, ASC in the right quadrant", () => {
    const d = new Date("2000-01-01T12:00:00Z");
    const h = computeHouses(d, 0, 0);
    const ramc = gmstDeg(d); // lon 0 → RAMC = GST
    const mcRef = lonFromRa(ramc);
    // At φ = 0 the closed form reduces to ASC = atan2(cos RAMC, −sin RAMC·cos ε).
    const ascRef = norm(
      Math.atan2(Math.cos(ramc * RAD), -Math.sin(ramc * RAD) * Math.cos(EPS * RAD)) / RAD,
    );
    expect(diff(h.mc, mcRef)).toBeLessThan(1);
    expect(diff(h.ascendant, ascRef)).toBeLessThan(1);
    // The ASC is always 0–180° ahead of the MC (eastern half of the chart).
    const ahead = norm(h.ascendant - h.mc);
    expect(ahead).toBeGreaterThan(0);
    expect(ahead).toBeLessThan(180);
  });

  it("equator at LST 0h: MC 0° Aries, ASC 0° Cancer; at LST 6h: MC 0° Cancer, ASC 0° Libra", () => {
    const d = new Date("2010-06-01T00:00:00Z");
    // Pick the longitude that puts local sidereal time at 0h, then 6h.
    const lon0 = ((-gmstDeg(d) + 540) % 360) - 180;
    const h0 = computeHouses(d, 0, lon0);
    expect(diff(h0.mc, 0)).toBeLessThan(0.05);
    expect(diff(h0.ascendant, 90)).toBeLessThan(0.05);
    const lon6 = ((lon0 + 90 + 540) % 360) - 180;
    const h6 = computeHouses(d, 0, lon6);
    expect(diff(h6.mc, 90)).toBeLessThan(0.05);
    expect(diff(h6.ascendant, 180)).toBeLessThan(0.05);
  });

  it("southern hemisphere keeps the ASC east of the MC", () => {
    for (const hour of [0, 5, 11, 17, 23]) {
      const h = computeHouses(new Date(Date.UTC(2021, 8, 3, hour)), -33.87, 151.21);
      const ahead = norm(h.ascendant - h.mc);
      expect(ahead).toBeGreaterThan(0);
      expect(ahead).toBeLessThan(180);
    }
  });
});

describe("computeHouses — Placidus", () => {
  it("London uses Placidus with ordered cusps anchored on ASC and MC", () => {
    const h = computeHouses(new Date("1985-07-01T13:30:00Z"), 51.5, -0.13);
    expect(h.system).toBe("Placidus");
    expect(h.cusps).toHaveLength(12);
    expect(h.cusps[0]).toBeCloseTo(h.ascendant, 8);
    expect(h.cusps[9]).toBeCloseTo(h.mc, 8);
    for (let i = 0; i < 12; i++) {
      expect(diff(h.cusps[(i + 6) % 12], norm(h.cusps[i] + 180))).toBeLessThan(1e-8);
      const span = norm(h.cusps[(i + 1) % 12] - h.cusps[i]);
      expect(span).toBeGreaterThan(0);
      expect(span).toBeLessThan(90);
    }
  });

  it("London cusps satisfy the Placidus definition (hour angle = fraction of semi-arc)", () => {
    const lat = 51.5;
    const h = computeHouses(new Date("1985-07-01T13:30:00Z"), lat, -0.13);
    const ramc = raFromLon(h.mc);
    const check = (cusp: number, f: number, above: boolean) => {
      const decl = Math.asin(Math.sin(EPS * RAD) * Math.sin(cusp * RAD));
      const dsa = Math.acos(-Math.tan(lat * RAD) * Math.tan(decl)) / RAD;
      // Eastward RA offset from the MC: f·DSA above the horizon, 180 − f·NSA below.
      const expected = above ? f * dsa : 180 - f * (180 - dsa);
      expect(diff(norm(raFromLon(cusp) - ramc), expected)).toBeLessThan(0.05);
    };
    check(h.cusps[10], 1 / 3, true);
    check(h.cusps[11], 2 / 3, true);
    check(h.cusps[0], 1, true); // the ASC is the full diurnal semi-arc
    check(h.cusps[1], 2 / 3, false);
    check(h.cusps[2], 1 / 3, false);
  });

  it("at the equator every semi-arc is 90°, so cusps 11/12/2/3 sit at RAMC +30/+60/+120/+150", () => {
    const h = computeHouses(new Date("1995-11-20T07:45:00Z"), 0, 10);
    const ramc = raFromLon(h.mc);
    expect(diff(h.cusps[10], lonFromRa(ramc + 30))).toBeLessThan(0.05);
    expect(diff(h.cusps[11], lonFromRa(ramc + 60))).toBeLessThan(0.05);
    expect(diff(h.cusps[1], lonFromRa(ramc + 120))).toBeLessThan(0.05);
    expect(diff(h.cusps[2], lonFromRa(ramc + 150))).toBeLessThan(0.05);
  });
});

describe("computeHouses — high latitude", () => {
  it("Tromsø falls back to Whole Sign without throwing", () => {
    const h = computeHouses(new Date("1990-12-21T10:00:00Z"), 69.65, 18.96);
    expect(h.system).toBe("WholeSign");
    expect(h.cusps[0]).toBe(Math.floor(h.ascendant / 30) * 30);
    h.cusps.forEach((c, i) => expect(c).toBe(norm(h.cusps[0] + 30 * i)));
  });

  it("never returns NaN, even near the poles", () => {
    for (const lat of [-89.9, -70, 66, 89.9]) {
      for (const hour of [0, 6, 12, 18]) {
        const h = computeHouses(new Date(Date.UTC(2003, 2, 20, hour)), lat, 25);
        expect(Number.isFinite(h.ascendant)).toBe(true);
        expect(Number.isFinite(h.mc)).toBe(true);
        h.cusps.forEach((c) => expect(Number.isFinite(c)).toBe(true));
      }
    }
  });
});

describe("houseOf", () => {
  const cusps = [100, 130, 160, 190, 220, 250, 280, 310, 340, 10, 40, 70];
  it("returns 1–12 and handles the 0° wrap", () => {
    expect(houseOf(100, cusps)).toBe(1);
    expect(houseOf(129.9, cusps)).toBe(1);
    expect(houseOf(130, cusps)).toBe(2);
    expect(houseOf(355, cusps)).toBe(9);
    expect(houseOf(5, cusps)).toBe(9);
    expect(houseOf(10, cusps)).toBe(10);
    expect(houseOf(99, cusps)).toBe(12);
  });
});
