// Server-only by convention. Signed cookie that keeps a just-created Lab profile
// open in the browser that created it, before the email is verified.
//
// Value: <profileId>.<expiresAtSeconds>.<hmac>. It holds no personal data. It is
// only honoured for a profile that is still unclaimed (see viewer.ts), so a stale
// cookie never exposes a verified user's profile. Without LAB_SESSION_SECRET
// (32+ chars) nothing is signed or accepted: the visitor falls back to the email link.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "lab_profile";
export const SESSION_TTL_S = 7 * 24 * 60 * 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string | null {
  const s = process.env.LAB_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

const mac = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

/** @param now injectable clock (ms) for tests */
export function signSession(profileId: string, now: number = Date.now()): string | null {
  const key = secret();
  if (!key || !UUID_RE.test(profileId)) return null;
  const payload = `${profileId}.${Math.floor(now / 1000) + SESSION_TTL_S}`;
  return `${payload}.${mac(payload, key)}`;
}

/** The profile id for a valid, unexpired value, else null. */
export function verifySession(value: string, now: number = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!UUID_RE.test(id) || !/^\d+$/.test(exp)) return null;
  const expected = Buffer.from(mac(`${id}.${exp}`, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number(exp) * 1000 > now ? id : null;
}

/** Cookie attributes. `maxAge: 0` clears it. */
export const sessionCookieOptions = (maxAge: number = SESSION_TTL_S) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});
