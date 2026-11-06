import { describe, expect, it } from "vitest";
import { isRetrograde, positionsAt } from "@/lib/astro/positions";
import { angularDistance } from "@/lib/astro/aspects";

describe("positionsAt", () => {
  it("2024-04-08 total eclipse: Sun and Moon at ~19.2° Aries, nearly conjunct", () => {
    const p = positionsAt(new Date("2024-04-08T18:21:00Z"));
    expect(p.Sun).toBeGreaterThanOrEqual(19.0);
    expect(p.Sun).toBeLessThanOrEqual(19.5);
    expect(p.Moon).toBeGreaterThanOrEqual(19.0);
    expect(p.Moon).toBeLessThanOrEqual(19.5);
    expect(angularDistance(p.Sun, p.Moon)).toBeLessThan(0.1);
  });

  it("2000-01-06 new moon: Sun and Moon within 0.3° of 285.8°", () => {
    const p = positionsAt(new Date("2000-01-06T18:14:00Z"));
    expect(angularDistance(p.Sun, 285.8)).toBeLessThan(0.3);
    expect(angularDistance(p.Moon, 285.8)).toBeLessThan(0.3);
  });

  it("returns every body in 0–360", () => {
    const p = positionsAt(new Date("1990-05-17T08:00:00Z"));
    const bodies = Object.keys(p);
    expect(bodies).toHaveLength(11);
    for (const lon of Object.values(p)) {
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(360);
    }
  });

  it("mean node at J2000.0 matches Meeus Ω0 = 125.04452°", () => {
    // At 2000-01-01 12:00 TT, T = 0. UTC is ~64s earlier; the node moves
    // ~0.05°/day, so the difference is negligible.
    const p = positionsAt(new Date("2000-01-01T11:58:56Z"));
    expect(angularDistance(p.NorthNode, 125.04452)).toBeLessThan(0.001);
  });
});

describe("isRetrograde", () => {
  it("Sun and Moon are never retrograde; the mean node always is", () => {
    const d = new Date("2024-04-08T18:21:00Z");
    expect(isRetrograde("Sun", d)).toBe(false);
    expect(isRetrograde("Moon", d)).toBe(false);
    expect(isRetrograde("NorthNode", d)).toBe(true);
  });

  it("Mercury was retrograde on 2024-04-08 (Rx 1–25 April 2024)", () => {
    expect(isRetrograde("Mercury", new Date("2024-04-08T12:00:00Z"))).toBe(true);
    expect(isRetrograde("Mercury", new Date("2024-03-15T12:00:00Z"))).toBe(false);
  });
});
