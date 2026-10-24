// Server-only by convention (the `server-only` package is not installed).
// In-memory sliding-window rate limiter keyed by client IP.
//
// BEST EFFORT: state lives in one serverless instance's memory, so a burst that
// lands on several instances is not counted together and a cold start resets it.
// It blunts casual abuse; it is not a security boundary. The cross-instance
// guard for the one upstream we must not hammer (Nominatim) is lab_take_slot().

export type RateLimiter = {
  /** Records a hit for `key`; returns false once the window is full. */
  allow(key: string): boolean;
};

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();
  return {
    allow(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < opts.windowMs);
      if (recent.length >= opts.limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      // Opportunistic cleanup so the map cannot grow without bound.
      if (hits.size > 5000) {
        hits.forEach((v, k) => {
          if (v.every((x) => t - x >= opts.windowMs)) hits.delete(k);
        });
      }
      return true;
    },
  };
}

const WINDOW_MS = 10 * 60 * 1000;
/** 10 requests / 10 min per IP. */
export const computeLimiter = createRateLimiter({ limit: 10, windowMs: WINDOW_MS });
/** 5 requests / 10 min per IP. */
export const gateLimiter = createRateLimiter({ limit: 5, windowMs: WINDOW_MS });

/** First entry of x-forwarded-for, else "unknown". */
export function clientIp(headers: { get(name: string): string | null }): string {
  const xff = headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  return first || "unknown";
}
