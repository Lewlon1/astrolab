import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { longitudeOf } from "@/lib/astro/positions";
import { signsOverWindow } from "@/lib/astro/signs";
import { zoneFor } from "@/lib/astro/time";

const fixturePath = path.join(__dirname, "fixtures.local.json");
const hasFixture = existsSync(fixturePath);

/** Scan March 2024 for the first UTC day on which the Moon changes sign. */
function findMoonIngressDay(): string {
  for (let day = 1; day <= 31; day++) {
    const iso = `2024-03-${String(day).padStart(2, "0")}`;
    const signs = signsOverWindow(
      (d) => longitudeOf("Moon", d),
      new Date(`${iso}T00:00:00Z`),
      new Date(`${iso}T23:59:00Z`),
    );
    if (signs.length === 2) return iso;
  }
  throw new Error("no Moon ingress found");
}

describe("computeChart", () => {
  it("unknown time: lists both Moon signs on an ingress day, no houses or rising", () => {
    const dateISO = findMoonIngressDay();
    const chart = computeChart({ dateISO, timeHHMM: null, lat: 0, lon: 0, zone: "UTC" });
    expect(chart.hasTime).toBe(false);
    expect(chart.ambiguous.Moon).toHaveLength(2);
    expect(chart.houses).toBeNull();
    expect(chart.rising).toBeNull();
    for (const p of chart.positions) expect(p.house).toBeUndefined();
    // Only bodies whose sign actually changes are listed.
    for (const signs of Object.values(chart.ambiguous)) expect(signs!.length).toBeGreaterThan(1);
    expect(chart.ambiguous.Sun).toBeUndefined();
  });

  it("known time: houses, rising and a house on every position; no ambiguity", () => {
    const chart = computeChart({
      dateISO: "1985-07-01",
      timeHHMM: "14:30",
      lat: 51.5,
      lon: -0.13,
      zone: "Europe/London",
    });
    expect(chart.birthUtc.toISOString()).toBe("1985-07-01T13:30:00.000Z");
    expect(chart.hasTime).toBe(true);
    expect(chart.ambiguous).toEqual({});
    expect(chart.houses?.system).toBe("Placidus");
    expect(chart.rising).not.toBeNull();
    expect(chart.positions).toHaveLength(11);
    for (const p of chart.positions) {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(p.degree).toBeGreaterThanOrEqual(0);
      expect(p.degree).toBeLessThan(30);
    }
    expect(chart.positions.find((p) => p.body === "Sun")?.sign).toBe("Cancer");
  });

  it.skipIf(!hasFixture)("Gabs fixture: Pisces Sun, Sagittarius Moon, Taurus rising", () => {
    const f = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      dateISO: string;
      timeHHMM: string;
      lat: number;
      lon: number;
    };
    const chart = computeChart({ ...f, zone: zoneFor(f.lat, f.lon) });
    expect(chart.positions.find((p) => p.body === "Sun")?.sign).toBe("Pisces");
    expect(chart.positions.find((p) => p.body === "Moon")?.sign).toBe("Sagittarius");
    expect(chart.rising).toBe("Taurus");
  });
});
