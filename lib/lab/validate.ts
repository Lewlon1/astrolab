// Server-only by convention (the `server-only` package is not installed).
// Hand-written input guards for the compute and gate request bodies.
import { CARDS } from "@/content/lab/cards";
import { ERRORS, VALIDATION } from "@/content/lab/ui";

export type LabSrc = "manychat" | "bio" | "ad" | "lora";
const SRC_VALUES: readonly string[] = ["manychat", "bio", "ad", "lora"];

export type ComputeInput = {
  date: string;
  /** HH:MM or null when unknown */
  time: string | null;
  place: string;
  card: string;
  src: LabSrc | null;
};
export type GateInput = ComputeInput & { email: string };

export type Validated<T> = { ok: true; value: T } | { ok: false; field: string; message: string };

// Same pattern as app/api/leads/route.ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_DATE = "1900-01-01";

const fail = (field: string, message: string): { ok: false; field: string; message: string } => ({
  ok: false,
  field,
  message,
});

function isRealDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
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

  const srcRaw = str(b.src);
  const src = SRC_VALUES.includes(srcRaw) ? (srcRaw as LabSrc) : null;

  return { ok: true, value: { date, time, place, card, src } };
}

export function validateGate(body: unknown, now: Date = new Date()): Validated<GateInput> {
  const base = validateCompute(body, now);
  if (!base.ok) return base;
  const b = body as Record<string, unknown>;
  const email = str(b.email).trim();
  if (!EMAIL_RE.test(email)) return fail("email", ERRORS.emailInvalid);
  return { ok: true, value: { ...base.value, email: email.toLowerCase() } };
}
