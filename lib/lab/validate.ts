// Server-only by convention (the `server-only` package is not installed).
// Hand-written input guards for the compute, gate and feedback request bodies.
import { CARDS } from "@/content/lab/cards";
import { SIGNS } from "@/content/lab/signs";
import { ERRORS, VALIDATION } from "@/content/lab/ui";

export type LabSrc = "manychat" | "bio" | "ad" | "lora";
const SRC_VALUES: readonly string[] = ["manychat", "bio", "ad", "lora"];

/** Accept only the known traffic sources; anything else (including arrays from repeated query params) is null. */
export function parseLabSrc(v: unknown): LabSrc | null {
  return typeof v === "string" && SRC_VALUES.includes(v) ? (v as LabSrc) : null;
}

/** A place the visitor already picked (or that a previous compute resolved). */
export type ChosenGeo = { lat: number; lon: number; displayName: string };

export type ComputeInput = {
  date: string;
  /** HH:MM or null when unknown */
  time: string | null;
  place: string;
  card: string;
  src: LabSrc | null;
  /** Resolved place from a previous step; when set, no geocoding happens. */
  geo: ChosenGeo | null;
};
export type GateInput = ComputeInput & {
  email: string;
  /** The reading's client id, so a vote cast before the gate links to the profile. */
  drawId: string | null;
};

export type ReadingRelation = "mirror" | "agree" | "tension";

export type FeedbackInput = {
  drawId: string;
  vote: 1 | -1;
  card: string;
  /** The cards dealt alongside it (2-6 known names, including `card`), or null. */
  shown: string[] | null;
  /** One sign, or two in order when it changed across the birth day. */
  sun: string[];
  moon: string[];
  relation: ReadingRelation;
  hasTime: boolean;
  src: LabSrc | null;
};

export type Validated<T> = { ok: true; value: T } | { ok: false; field: string; message: string };

// Same pattern as app/api/leads/route.ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_DATE = "1900-01-01";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RELATIONS: readonly string[] = ["mirror", "agree", "tension"];

/** A client-generated reading id (crypto.randomUUID), lower-cased; anything else is null. */
export function parseDrawId(v: unknown): string | null {
  return typeof v === "string" && UUID_RE.test(v) ? v.toLowerCase() : null;
}

/** 2-6 distinct known card names that include the chosen card, else null (dropped, not an error). */
function parseShown(v: unknown, card: string): string[] | null {
  if (!Array.isArray(v) || v.length < 2 || v.length > 6) return null;
  if (!v.every((x) => typeof x === "string" && CARDS.some((c) => c.name === x))) return null;
  if (new Set(v).size !== v.length || !v.includes(card)) return null;
  return v as string[];
}

/** One or two known sign names, else null. */
function parseSigns(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > 2) return null;
  return v.every((x) => typeof x === "string" && SIGNS.some((s) => s.name === x)) ? (v as string[]) : null;
}

const fail = (field: string, message: string): { ok: false; field: string; message: string } => ({
  ok: false,
  field,
  message,
});

function isRealDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Optional resolved place: finite in-range coordinates and a bounded name, else null. */
function parseGeo(v: unknown): ChosenGeo | null {
  if (!v || typeof v !== "object") return null;
  const g = v as Record<string, unknown>;
  const lat = g.lat;
  const lon = g.lon;
  const name = str(g.displayName).trim();
  if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (!name || name.length > 200) return null;
  return { lat, lon, displayName: name };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** @param now injectable clock for tests */
export function validateCompute(body: unknown, now: Date = new Date()): Validated<ComputeInput> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const date = str(b.date).trim();
  if (!date) return fail("date", ERRORS.dateMissing);
  const m = DATE_RE.exec(date);
  if (!m || !isRealDate(+m[1], +m[2], +m[3])) return fail("date", VALIDATION.dateInvalid);
  const today = now.toISOString().slice(0, 10);
  if (date < MIN_DATE || date > today) return fail("date", VALIDATION.dateRange);

  const timeRaw = str(b.time).trim();
  let time: string | null = null;
  if (timeRaw) {
    if (!TIME_RE.test(timeRaw)) return fail("time", VALIDATION.timeInvalid);
    time = timeRaw;
  }

  const place = str(b.place).trim();
  if (!place) return fail("place", ERRORS.placeMissing);
  if (place.length < 2 || place.length > 120) return fail("place", VALIDATION.placeLength);

  const card = str(b.card);
  if (!CARDS.some((c) => c.name === card)) return fail("card", VALIDATION.cardUnknown);

  const src = parseLabSrc(b.src);

  return { ok: true, value: { date, time, place, card, src, geo: parseGeo(b.geo) } };
}

export function validateGate(body: unknown, now: Date = new Date()): Validated<GateInput> {
  const base = validateCompute(body, now);
  if (!base.ok) return base;
  const b = body as Record<string, unknown>;
  const email = str(b.email).trim();
  if (!EMAIL_RE.test(email)) return fail("email", ERRORS.emailInvalid);
  return { ok: true, value: { ...base.value, email: email.toLowerCase(), drawId: parseDrawId(b.drawId) } };
}

/** Thumbs up/down on an instant reading. Fields come from the reading the server composed. */
export function validateFeedback(body: unknown): Validated<FeedbackInput> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const drawId = parseDrawId(b.drawId);
  if (!drawId) return fail("drawId", VALIDATION.feedbackInvalid);
  if (b.vote !== 1 && b.vote !== -1) return fail("vote", VALIDATION.feedbackInvalid);
  const card = str(b.card);
  if (!CARDS.some((c) => c.name === card)) return fail("card", VALIDATION.cardUnknown);
  const sun = parseSigns(b.sun);
  const moon = parseSigns(b.moon);
  if (!sun || !moon) return fail("sign", VALIDATION.feedbackInvalid);
  const relation = str(b.relation);
  if (!RELATIONS.includes(relation)) return fail("relation", VALIDATION.feedbackInvalid);
  return {
    ok: true,
    value: {
      drawId,
      vote: b.vote,
      card,
      shown: parseShown(b.shown, card),
      sun,
      moon,
      relation: relation as ReadingRelation,
      hasTime: b.hasTime === true,
      src: parseLabSrc(b.src),
    },
  };
}
