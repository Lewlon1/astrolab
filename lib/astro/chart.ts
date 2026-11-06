// Natal chart assembly. Unknown birth time → no houses, no rising, and
// any body whose sign changes across the local birth day is listed in
// `ambiguous` rather than guessed.

import { computeHouses, houseOf, type Houses } from "./houses";
import { isRetrograde, longitudeOf } from "./positions";
import { degreeInSign, signOf, signsOverWindow } from "./signs";
import { localToUtc } from "./time";
import { BODIES, type Body, type Position, type Sign } from "./types";

export type ChartInput = {
  dateISO: string;
  timeHHMM: string | null;
  lat: number;
  lon: number;
  zone: string;
};

export type Chart = {
  birthUtc: Date;
  hasTime: boolean;
  approximateZone: boolean;
  positions: Position[];
  ambiguous: Partial<Record<Body, Sign[]>>;
  houses: Houses | null;
  rising: Sign | null;
};

export function computeChart({ dateISO, timeHHMM, lat, lon, zone }: ChartInput): Chart {
  const { utc, dayStartUtc, dayEndUtc, approximateZone } = localToUtc(dateISO, timeHHMM, zone);
  const hasTime = timeHHMM !== null;
  const houses = hasTime ? computeHouses(utc, lat, lon) : null;

  const positions: Position[] = BODIES.map((body) => {
    const l = longitudeOf(body, utc);
    const p: Position = {
      body,
      lon: l,
      sign: signOf(l),
      degree: degreeInSign(l),
      retrograde: isRetrograde(body, utc),
    };
    if (houses) p.house = houseOf(l, houses.cusps);
    return p;
  });

  const ambiguous: Partial<Record<Body, Sign[]>> = {};
  if (!hasTime) {
    for (const body of BODIES) {
      const signs = signsOverWindow((d) => longitudeOf(body, d), dayStartUtc, dayEndUtc);
      if (signs.length > 1) ambiguous[body] = signs;
    }
  }

  return {
    birthUtc: utc,
    hasTime,
    approximateZone,
    positions,
    ambiguous,
    houses,
    rising: houses ? signOf(houses.ascendant) : null,
  };
}
