// Pure, client-safe deck helpers for the Lab Draw.

/**
 * Pick `count` distinct items with a partial Fisher-Yates shuffle.
 * @param pool items to draw from (not mutated)
 * @param random injectable source of [0, 1) numbers, for tests
 */
export function drawCards<T>(pool: readonly T[], count = 3, random: () => number = Math.random): T[] {
  const a = pool.slice();
  const n = Math.min(count, a.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (a.length - i));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a.slice(0, n);
}
