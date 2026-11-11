"use client";

// Experiment context for the /apply page and a tracker that stamps every lp_* event
// with lp_variant, experiment_id, concept, market, qa and the UTMs (Phase 3).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { track } from "@/lib/analytics/track";
import { EXPERIMENT_ID, type Variant } from "@/lib/experiments";
import { UTM_KEYS, type Utm } from "@/lib/apply/validate";
import type { ConceptKey } from "@/content/apply/concepts";
import type { Market } from "@/content/apply/offer";

export type LpEvent =
  | "lp_view"
  | "lp_cta_clicked"
  | "lp_draw_started"
  | "lp_reading_viewed"
  | "lp_email_captured"
  | "lp_application_started"
  | "lp_application_submitted"
  | "lp_booking_clicked"
  | "lp_call_booked";

/** Funnel milestones are `conversion`; the rest are `interaction`. */
const CONVERSIONS: ReadonlySet<LpEvent> = new Set<LpEvent>(["lp_email_captured", "lp_application_submitted", "lp_call_booked"]);

export type LpCtx = { variant: Variant; concept: ConceptKey; market: Market; qa: boolean };

type Value = LpCtx & {
  utm: Utm;
  lpTrack: (name: LpEvent, props?: Record<string, unknown>) => void;
};

const Ctx = createContext<Value | null>(null);

function readUtm(): Utm {
  const p = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const out = {} as Utm;
  for (const k of UTM_KEYS) out[k] = p.get(k)?.slice(0, 300) || null;
  return out;
}

export function LpProvider({ value, children }: { value: LpCtx; children: ReactNode }) {
  // UTMs are read once on the landing URL; the visitor never leaves the page.
  const utmRef = useRef<Utm | null>(null);
  if (utmRef.current === null && typeof window !== "undefined") utmRef.current = readUtm();
  const utm = utmRef.current ?? readUtm();

  const lpTrack = useCallback(
    (name: LpEvent, props: Record<string, unknown> = {}) => {
      track(CONVERSIONS.has(name) ? "conversion" : "interaction", name, {
        lp_variant: value.variant,
        experiment_id: EXPERIMENT_ID,
        concept: value.concept,
        market: value.market,
        qa: value.qa,
        ...utm,
        ...props,
      });
    },
    [value.variant, value.concept, value.market, value.qa, utm],
  );

  const v = useMemo(() => ({ ...value, utm, lpTrack }), [value, utm, lpTrack]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useLp(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLp must be used inside <LpProvider>");
  return v;
}

/** Fires lp_view once per mount. */
export function LpView() {
  const { lpTrack } = useLp();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    lpTrack("lp_view");
  }, [lpTrack]);
  return null;
}
