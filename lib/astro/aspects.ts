// Major (Ptolemaic) aspects between two ecliptic longitudes.

export const ASPECTS = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
} as const;

export type AspectType = keyof typeof ASPECTS;

/** Orb in degrees per aspect; `default` applies to any aspect not listed. */
export type Orbs = { default: number } & Partial<Record<AspectType, number>>;

/** Shortest arc between two longitudes, 0–180. */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** The tightest aspect within orb, or null. `orb` is the absolute deviation from exact. */
export function findAspect(
  a: number,
  b: number,
  orbs: Orbs = { default: 6 },
): { type: AspectType; orb: number } | null {
  const sep = angularDistance(a, b);
  let best: { type: AspectType; orb: number } | null = null;
  for (const type of Object.keys(ASPECTS) as AspectType[]) {
    const orb = Math.abs(sep - ASPECTS[type]);
    const allowed = orbs[type] ?? orbs.default;
    if (orb <= allowed && (!best || orb < best.orb)) best = { type, orb };
  }
  return best;
}
