// Server-only by convention. Builds the jsonb stored in lab_profiles.positions.
import type { Chart } from "@/lib/astro";
import type { StoredChart } from "./types";

/** JSON-safe subset of a computeChart result. Without a time: no houses, no rising, no `house` on positions. */
export function toStoredChart(chart: Chart): StoredChart {
  const hasTime = chart.hasTime;
  return {
    version: 1,
    hasTime,
    approximateZone: chart.approximateZone,
    positions: chart.positions.map((p) => {
      const { house, ...rest } = p;
      return hasTime && house !== undefined ? { ...rest, house } : rest;
    }),
    ambiguous: chart.ambiguous,
    houses: hasTime ? chart.houses : null,
    rising: hasTime ? chart.rising : null,
  };
}
