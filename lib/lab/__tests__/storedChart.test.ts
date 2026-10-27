import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro";
import { toStoredChart } from "../storedChart";

const base = { dateISO: "1990-06-15", lat: 51.5, lon: -0.12, zone: "Europe/London" };

describe("toStoredChart", () => {
  it("without a time has no houses, no rising and no house on positions", () => {
    const s = toStoredChart(computeChart({ ...base, timeHHMM: null }));
    expect(s.version).toBe(1);
    expect(s.hasTime).toBe(false);
    expect(s.houses).toBeNull();
    expect(s.rising).toBeNull();
    expect(s.positions.length).toBeGreaterThan(0);
    for (const p of s.positions) expect("house" in p).toBe(false);
  });

  it("with a time has houses, rising and a house on every position", () => {
    const s = toStoredChart(computeChart({ ...base, timeHHMM: "14:30" }));
    expect(s.hasTime).toBe(true);
    expect(s.houses).not.toBeNull();
    expect(s.rising).not.toBeNull();
    for (const p of s.positions) expect(typeof p.house).toBe("number");
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
