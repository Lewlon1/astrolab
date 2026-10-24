// Server-only by convention. Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
import { timingSafeEqual } from "node:crypto";

/** Constant-time check of the Authorization header against the secret. */
export function isAuthorizedCron(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  // timingSafeEqual needs equal lengths; the length check leaks only the length.
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}
