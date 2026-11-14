// Best-effort per-IP limits for the /apply POST routes (see lib/lab/rateLimit.ts for caveats).
import { createRateLimiter } from "@/lib/lab/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
/** Step 1 email: 8 / 10 min per IP. */
export const partialLimiter = createRateLimiter({ limit: 8, windowMs: WINDOW_MS });
/** Full application: 5 / 10 min per IP. */
export const applyLimiter = createRateLimiter({ limit: 5, windowMs: WINDOW_MS });
