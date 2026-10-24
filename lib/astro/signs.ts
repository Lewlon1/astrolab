// Zodiac signs and sign-over-time helpers.

import type { Sign } from "./types";

export const SIGNS: readonly Sign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

/** Normalises any angle in degrees to [0, 360). */
export function normDeg(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

export function signOf(lon: number): Sign {
  return SIGNS[Math.floor(normDeg(lon) / 30) % 12];
}

export function degreeInSign(lon: number): number {
  return normDeg(lon) % 30;
}

/**
 * Distinct signs (in order of first appearance) that `fn` passes through
 * between `start` and `end`, sampled every `stepMinutes`. The endpoint is
 * always sampled, so a change in the last partial step is never missed.
 */
export function signsOverWindow(
  fn: (d: Date) => number,
  start: Date,
  end: Date,
  stepMinutes = 60,
): Sign[] {
  const out: Sign[] = [];
  const add = (t: number) => {
    const s = signOf(fn(new Date(t)));
    if (!out.includes(s)) out.push(s);
  };
  const stepMs = Math.max(1, stepMinutes) * 60_000;
  const t0 = start.getTime();
  const t1 = end.getTime();
  for (let t = t0; t < t1; t += stepMs) add(t);
  add(t1);
  return out;
}
