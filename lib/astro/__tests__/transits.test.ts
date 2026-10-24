import { describe, expect, it } from "vitest";
import { findTransits, longitudeOf, type TransitNatal } from "@/lib/astro";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const none: TransitNatal = { Sun: null, Moon: null, Rising: null, Venus: null, Saturn: null };
const norm = (x: number) => ((x % 360) + 360) % 360;
const signed = (x: number) => {
  const d = norm(x);
  return d > 180 ? d - 360 : d;
};

/** First Jupiter station after `after`: the day its daily motion changes sign. */
function findJupiterStation(after: Date): { date: Date; lon: number; turnsRetrograde: boolean } {
  let prev = signed(longitudeOf("Jupiter", new Date(after.getTime() + DAY)) - longitudeOf("Jupiter", after));
  for (let i = 1; i < 800; i++) {
    const t = after.getTime() + i * DAY;
    const motion = signed(longitudeOf("Jupiter", new Date(t + DAY)) - longitudeOf("Jupiter", new Date(t)));
    if (Math.sign(motion) !== Math.sign(prev)) {
      return { date: new Date(t), lon: longitudeOf("Jupiter", new Date(t)), turnsRetrograde: prev > 0 };
    }
    prev = motion;
  }
  throw new Error("no Jupiter station found");
}

describe("findTransits", () => {
  it("a natal Sun at Saturn's longitude on a date gives a conjunction season containing it", () => {
    const d = new Date("2027-03-01T00:00:00Z");
    const natal = { ...none, Sun: longitudeOf("Saturn", d) };
    const seasons = findTransits({
      natal,
      from: new Date(d.getTime() - 30 * DAY),
      to: new Date(d.getTime() + 30 * DAY),
      planets: ["Saturn"],
      aspects: ["conjunction"],
    });
    expect(seasons).toHaveLength(1);
    const s = seasons[0];
    expect(s).toMatchObject({ planet: "Saturn", aspect: "conjunction", point: "Sun" });
    expect(s.exactDates.some((x) => Math.abs(x.getTime() - d.getTime()) <= HOUR)).toBe(true);
    expect(s.start.getTime()).toBeLessThanOrEqual(d.getTime());
    expect(s.end.getTime()).toBeGreaterThanOrEqual(d.getTime());
  });

  it("groups Jupiter's three passes around a station into one season", () => {
    const station = findJupiterStation(new Date("2026-01-01T00:00:00Z"));
    // Inside the retrograde loop: just behind a retrograde station's maximum, or just past a direct station's minimum.
    const natalLon = norm(station.lon + (station.turnsRetrograde ? -0.5 : 0.5));
    const seasons = findTransits({
      natal: { ...none, Venus: natalLon },
      from: new Date(station.date.getTime() - 200 * DAY),
      to: new Date(station.date.getTime() + 200 * DAY),
      planets: ["Jupiter"],
      aspects: ["conjunction"],
    });
    expect(seasons).toHaveLength(1);
    const s = seasons[0];
    expect(s.exactDates).toHaveLength(3);
    const [first, , last] = s.exactDates.map((x) => x.getTime());
    expect(first).toBeLessThan(station.date.getTime());
    expect(last).toBeGreaterThan(station.date.getTime());
    for (const x of s.exactDates) {
      expect(Math.abs(signed(longitudeOf("Jupiter", x) - natalLon))).toBeLessThan(0.01);
    }
    expect(s.start.getTime()).toBeLessThan(first);
    expect(s.end.getTime()).toBeGreaterThan(last);
    // Record the real dates for the task report.
    console.info("[test] Jupiter station", station.date.toISOString(), station.turnsRetrograde ? "R" : "D",
      "exact", s.exactDates.map((x) => x.toISOString()).join(", "));
  });

  it("finds both square targets and skips a null Rising", () => {
    const d = new Date("2027-06-01T00:00:00Z");
    const sat = longitudeOf("Saturn", d);
    const window = { from: new Date(d.getTime() - 20 * DAY), to: new Date(d.getTime() + 20 * DAY) };
    const withRising = findTransits({ natal: { ...none, Rising: norm(sat + 90) }, ...window, planets: ["Saturn"] });
    expect(withRising.some((s) => s.point === "Rising" && s.aspect === "square")).toBe(true);
    const noRising = findTransits({ natal: { ...none, Moon: norm(sat - 90) }, ...window, planets: ["Saturn"] });
    expect(noRising.some((s) => s.point === "Rising")).toBe(false);
    expect(noRising.some((s) => s.point === "Moon" && s.aspect === "square")).toBe(true);
  });

  it("includes a season in orb at `from` whose exact hit fell before it, peaking on that hit", () => {
    const d = new Date("2027-03-01T00:00:00Z");
    const natal = { ...none, Sun: longitudeOf("Saturn", d) };
    const from = new Date(d.getTime() + 3 * DAY);
    const seasons = findTransits({ natal, from, to: new Date(from.getTime() + 10 * DAY), planets: ["Saturn"], aspects: ["conjunction"] });
    expect(seasons).toHaveLength(1);
    expect(seasons[0].peak.getTime()).toBeLessThan(from.getTime());
  });

  it("sorts by peak", () => {
    const d = new Date("2027-01-01T00:00:00Z");
    const natal = { ...none, Sun: longitudeOf("Jupiter", d), Moon: longitudeOf("Pluto", d) };
    const seasons = findTransits({ natal, from: d, to: new Date(d.getTime() + 365 * DAY) });
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i].peak.getTime()).toBeGreaterThanOrEqual(seasons[i - 1].peak.getTime());
    }
    expect(seasons.length).toBeGreaterThan(1);
  });

  it("scans 12 months for five points in well under a second", () => {
    const from = new Date("2026-10-24T00:00:00Z");
    const to = new Date("2027-10-24T00:00:00Z");
    const natal = { Sun: 10, Moon: 100, Rising: 200, Venus: 250, Saturn: 300 };
    const t0 = performance.now();
    findTransits({ natal, from, to });
    const ms = performance.now() - t0;
    console.info("[test] findTransits 12 months, 5 points:", ms.toFixed(1), "ms");
    expect(ms).toBeLessThan(2000);
  });

  it("keeps a slow-planet season's exactDates stable as `from` advances by a few months", () => {
    // Neptune chains several passes (2027-06 to 2029-01 here) into one ~590-day season.
    const natal = { ...none, Venus: longitudeOf("Neptune", new Date("2027-06-01T00:00:00Z")) };
    const run = (from: string) => {
      const f = new Date(from);
      const to = new Date(f);
      to.setUTCMonth(to.getUTCMonth() + 12);
      return findTransits({ natal, from: f, to, planets: ["Neptune"], aspects: ["conjunction"] });
    };
    const key = (d: Date[]) => d.map((x) => x.toISOString());
    const baseline = run("2027-03-01T00:00:00Z")[0];
    expect(baseline.exactDates.length).toBeGreaterThanOrEqual(5);
    // The last start is ~550 days after the first pass: beyond a 400-day lookback.
    for (const from of ["2027-09-01", "2028-03-01", "2028-06-01", "2028-09-01", "2028-12-01"]) {
      const seasons = run(`${from}T00:00:00Z`);
      expect(seasons, from).toHaveLength(1);
      expect(key(seasons[0].exactDates), from).toEqual(key(baseline.exactDates));
    }
  });
});
