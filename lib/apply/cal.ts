// Cal.com 15-minute call for /apply: embed config with metadata, and webhook parsing.
// Cal turns `metadata[key]` booking-page params into booking metadata, which comes
// back on the webhook payload as `payload.metadata`.
import { CAL_USERNAME } from "@/lib/booking";
import { EXPERIMENT_ID, isVariant, type Variant } from "@/lib/experiments";
import { resolveConcept, type ConceptKey } from "@/content/apply/concepts";
import { isMarket, type Market } from "@/content/apply/offer";
import { UTM_KEYS, type Utm } from "./validate";

// TODO(Lewis): set NEXT_PUBLIC_APPLY_CAL_LINK to the real 15-minute event, e.g. "theastropsychelab/discovery-15".
export const APPLY_CAL_LINK = process.env.NEXT_PUBLIC_APPLY_CAL_LINK || `${CAL_USERNAME}/15min`;

export type CalPrefill = {
  leadId: string;
  name: string | null;
  email: string;
  lp_variant: Variant;
  concept: ConceptKey;
  market: Market;
  utm: Utm;
};

/** Booking-page params: prefill + metadata. Empty values are dropped. */
export function calParams(p: CalPrefill): Record<string, string> {
  const out: Record<string, string> = {
    email: p.email,
    "metadata[lead_id]": p.leadId,
    "metadata[lp_variant]": p.lp_variant,
    "metadata[experiment_id]": EXPERIMENT_ID,
    "metadata[concept]": p.concept,
    "metadata[market]": p.market,
  };
  if (p.name) out.name = p.name;
  for (const k of UTM_KEYS) {
    const v = p.utm[k];
    if (v) out[`metadata[${k}]`] = v;
  }
  return out;
}

/** Plain booking URL (fallback link when the embed can't open). */
export function calUrl(p: CalPrefill): string {
  const u = new URL(`https://cal.com/${APPLY_CAL_LINK}`);
  for (const [k, v] of Object.entries(calParams(p))) u.searchParams.set(k, v);
  return u.toString();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOOKED_TRIGGERS = new Set(["BOOKING_CREATED", "BOOKING_REQUESTED"]);

export type LpBooking = {
  uid: string;
  leadId: string;
  lp_variant: Variant;
  concept: ConceptKey;
  market: Market;
  utm: Utm;
};

/** A Cal webhook body for a new /apply booking, or null for anything else. */
export function parseLpBooking(body: unknown): LpBooking | null {
  if (!body || typeof body !== "object") return null;
  const { triggerEvent, payload } = body as { triggerEvent?: unknown; payload?: Record<string, unknown> };
  if (typeof triggerEvent !== "string" || !BOOKED_TRIGGERS.has(triggerEvent)) return null;
  if (!payload || typeof payload !== "object") return null;
  const uid = typeof payload.uid === "string" ? payload.uid : null;
  const m = payload.metadata && typeof payload.metadata === "object" ? (payload.metadata as Record<string, unknown>) : null;
  if (!uid || !m) return null;
  const leadId = typeof m.lead_id === "string" && UUID_RE.test(m.lead_id) ? m.lead_id : null;
  if (!leadId || !isVariant(m.lp_variant) || !isMarket(m.market)) return null;
  const s = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 300) : null);
  return {
    uid,
    leadId,
    lp_variant: m.lp_variant,
    concept: resolveConcept(m.concept),
    market: m.market,
    utm: {
      utm_source: s(m.utm_source),
      utm_medium: s(m.utm_medium),
      utm_campaign: s(m.utm_campaign),
      utm_content: s(m.utm_content),
      utm_term: s(m.utm_term),
    },
  };
}
