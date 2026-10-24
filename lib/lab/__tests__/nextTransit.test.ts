import { describe, expect, it } from "vitest";
import type { TransitSeason } from "@/lib/astro";
import { natalPointsFromStoredChart, nextTransitFields, seasonsForChart, serializeSeasons } from "../nextTransit";
import { fakeChart } from "./helpers";

const withLons = (hasTime: boolean) => {
  const chart = fakeChart({ sun: "Aries", moon: "Taurus", hasTime, ambiguous: hasTime ? {} : { Moon: ["Taurus", "Gemini"] } });
  const lon: Record<string, number> = { Sun: 10, Moon: 45, Venus: 200, Saturn: 300 };
  chart.positions = chart.positions.map((p) => (p.body in lon ? { ...p, lon: lon[p.body] } : p));
  return chart;
};

const season = (over: Partial<TransitSeason> = {}): TransitSeason => ({
  planet: "Saturn",
  aspect: "square",
  point: "Moon",
  exactDates: [new Date("2027-02-14T21:30:00Z")],
  start: new Date("2027-01-20T00:00:00Z"),
  end: new Date("2027-03-10T00:00:00Z"),
  peak: new Date("2027-02-14T21:30:00Z"),
  ...over,
});

describe("natalPointsFromStoredChart", () => {
  it("uses stored longitudes and the ascendant when the time is known", () => {
    expect(natalPointsFromStoredChart(withLons(true))).toEqual({ Sun: 10, Moon: 45, Venus: 200, Saturn: 300, Rising: 100 });
  });

  it("keeps ambiguous bodies at their stored longitude and skips Rising without a time", () => {
    expect(natalPointsFromStoredChart(withLons(false))).toEqual({ Sun: 10, Moon: 45, Venus: 200, Saturn: 300, Rising: null });
  });

  it("skips Rising when hasTime is set but houses are missing", () => {
    const chart = { ...withLons(true), houses: null };
    expect(natalPointsFromStoredChart(chart).Rising).toBeNull();
  });
});

describe("nextTransitFields", () => {
  it("maps the first season to its headline and UTC peak date", () => {
    expect(nextTransitFields([season(), season({ planet: "Pluto" })])).toEqual({
      next_transit: "Saturn squares your Moon",
      transit_peak_date: "2027-02-14",
    });
  });

  it("is null when there are no seasons", () => {
    expect(nextTransitFields([])).toEqual({ next_transit: null, transit_peak_date: null });
  });
});

describe("seasonsForChart / serializeSeasons", () => {
  it("returns seasons overlapping the next 12 months, with ISO dates once serialised", () => {
    const now = new Date("2026-10-24T00:00:00Z");
    const seasons = seasonsForChart(withLons(false), now);
    expect(seasons.length).toBeGreaterThan(0);
    expect(seasons.some((s) => s.point === "Rising")).toBe(false);
    const limit = new Date("2027-10-24T00:00:00Z").getTime();
    for (const s of seasons) {
      expect(s.end.getTime()).toBeGreaterThanOrEqual(now.getTime());
      expect(s.start.getTime()).toBeLessThanOrEqual(limit);
    }
    const out = serializeSeasons(seasons);
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
    expect(out[0].peak).toBe(seasons[0].peak.toISOString());
  });
});
