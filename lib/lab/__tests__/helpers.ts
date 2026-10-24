import { BODIES, type Body, type Sign } from "@/lib/astro";
import type { LabProfileRow, StoredChart } from "../types";

/** Build a minimal StoredChart with chosen Sun/Moon (and optional ambiguity). */
export function fakeChart(opts: {
  sun: Sign;
  moon: Sign;
  hasTime?: boolean;
  ambiguous?: Partial<Record<Body, Sign[]>>;
  rising?: Sign | null;
}): StoredChart {
  const hasTime = opts.hasTime ?? false;
  return {
    version: 1,
    hasTime,
    approximateZone: false,
    positions: BODIES.map((body) => ({
      body,
      lon: 15,
      sign: body === "Sun" ? opts.sun : body === "Moon" ? opts.moon : "Aries",
      degree: 14.6,
      ...(hasTime ? { house: 3 } : {}),
    })),
    ambiguous: opts.ambiguous ?? {},
    houses: hasTime ? { system: "Placidus", ascendant: 100, mc: 10, cusps: Array(12).fill(0) } : null,
    rising: hasTime ? (opts.rising ?? "Cancer") : null,
  };
}

export function fakeRow(chart: StoredChart, card = "The Tower"): LabProfileRow {
  return {
    id: "1", user_id: null, email: "a@b.co", lead_id: null, card_drawn: card,
    birth_date: "1990-01-01", birth_time: chart.hasTime ? "12:00:00" : null,
    birth_place_text: "x", lat: 0, lon: 0, tz: "UTC", birth_utc: "1990-01-01T12:00:00Z",
    positions: chart, src: null, consent_at: "", consent_text_version: "v", next_transit: null,
    transit_peak_date: null, created_at: null, updated_at: null, deleted_at: null,
  };
}
