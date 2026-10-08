/**
 * Whether a section counts as "seen". A fixed 50%-of-the-section rule can never
 * be met by a section taller than twice the viewport (e.g. the tarot spread on
 * a phone), so the bar is the smaller of 50% of the section and 50% of the
 * viewport height.
 */
export function isSectionVisible(m: {
  intersectionHeight: number;
  targetHeight: number;
  viewportHeight: number;
}): boolean {
  const { intersectionHeight, targetHeight, viewportHeight } = m;
  if (!(targetHeight > 0) || !(viewportHeight > 0)) return false;
  const needed = Math.min(targetHeight, viewportHeight) * 0.5;
  // 1px tolerance: sub-pixel layout makes an exact-50% intersection come in just under.
  return intersectionHeight >= needed - 1;
}

/** Fine-grained observer thresholds so tall sections get a callback near the bar. */
export const VISIBILITY_THRESHOLDS: number[] = Array.from(
  { length: 21 },
  (_, i) => i / 20
);
