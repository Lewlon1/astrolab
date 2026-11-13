// Validation for the /apply POST routes. Pure; shared by routes and tests.
// Error messages say what to fix and never echo the input back.
import { APPLICATION_UI, QUESTIONS } from "@/content/apply/application";
import { resolveConcept, type ConceptKey } from "@/content/apply/concepts";
import { isMarket, type Market } from "@/content/apply/offer";

export type Utm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Validated<T> = { ok: true; value: T } | { ok: false; field: string; message: string };

const fail = (field: string, message: string) => ({ ok: false as const, field, message });

const shortStr = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

export function parseUtm(v: unknown): Utm {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return {
    utm_source: shortStr(o.utm_source, 200),
    utm_medium: shortStr(o.utm_medium, 200),
    utm_campaign: shortStr(o.utm_campaign, 200),
    utm_content: shortStr(o.utm_content, 300),
    utm_term: shortStr(o.utm_term, 200),
  };
}

export function normaliseEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

export type PartialInput = {
  email: string;
  consentVersion: string;
  concept: ConceptKey;
  market: Market;
  utm: Utm;
  sessionKey: string | null;
  /** Variant B: what the reading showed, for MailerLite fields. Never birth data. */
  reading: { card: string; sun: string; moon: string } | null;
};

export function validatePartial(body: unknown): Validated<PartialInput> {
  if (!body || typeof body !== "object") return fail("form", APPLICATION_UI.errors.generic);
  const b = body as Record<string, unknown>;
  const email = normaliseEmail(b.email);
  if (!email) return fail("email", APPLICATION_UI.errors.email);
  if (b.consent !== true) return fail("consent", APPLICATION_UI.errors.consent);
  if (!isMarket(b.market)) return fail("form", APPLICATION_UI.errors.generic);
  let reading: PartialInput["reading"] = null;
  if (b.reading && typeof b.reading === "object") {
    const r = b.reading as Record<string, unknown>;
    const card = shortStr(r.card, 60);
    const sun = shortStr(r.sun, 40);
    const moon = shortStr(r.moon, 40);
    if (card && sun && moon) reading = { card, sun, moon };
  }
  return {
    ok: true,
    value: {
      email,
      consentVersion: shortStr(b.consentVersion, 40) ?? "unknown",
      concept: resolveConcept(b.concept),
      market: b.market,
      utm: parseUtm(b.utm),
      sessionKey: shortStr(b.sessionKey, 64),
      reading,
    },
  };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** YYYY-MM-DD (what <input type="date"> sends), a real calendar day, 1900 to today. */
export function isBirthDate(v: string, now: Date = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return false;
  return y >= 1900 && dt.getTime() <= now.getTime();
}

export type ApplicationInput = {
  leadId: string;
  email: string;
  answers: Record<string, string>;
};

/** Validates the full application against content/apply/application.ts. */
export function validateApplication(body: unknown): Validated<ApplicationInput> {
  if (!body || typeof body !== "object") return fail("form", APPLICATION_UI.errors.generic);
  const b = body as Record<string, unknown>;
  const email = normaliseEmail(b.email);
  if (!email) return fail("email", APPLICATION_UI.errors.email);
  const leadId = typeof b.leadId === "string" && UUID_RE.test(b.leadId) ? b.leadId : null;
  if (!leadId) return fail("form", APPLICATION_UI.errors.generic);
  const raw = b.answers && typeof b.answers === "object" ? (b.answers as Record<string, unknown>) : {};

  const answers: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const v = typeof raw[q.id] === "string" ? (raw[q.id] as string).trim() : "";
    if (!v) {
      if (q.required) return fail(q.id, q.kind === "choice" ? APPLICATION_UI.errors.choice : APPLICATION_UI.errors.required);
      continue;
    }
    if (q.kind === "choice") {
      if (!q.options.some((o) => o.value === v)) return fail(q.id, APPLICATION_UI.errors.choice);
    } else if (q.kind === "date") {
      if (!isBirthDate(v)) return fail(q.id, APPLICATION_UI.errors.date);
    } else if (q.kind === "time") {
      if (!TIME_RE.test(v)) return fail(q.id, APPLICATION_UI.errors.time);
    } else if (v.length > q.maxLength) {
      return fail(q.id, APPLICATION_UI.errors.tooLong.replace("{max}", String(q.maxLength)));
    }
    answers[q.id] = v;
  }
  return { ok: true, value: { leadId, email, answers } };
}
