// Server-only by convention. Leads + lead_events for the /apply funnel.
// Extends the Lab pattern (lib/lab/events.ts) with the experiment fields every
// /apply event must carry. Never throws; logs fixed strings and error codes only,
// never the email, answers or event detail.
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPERIMENT_ID, type Variant } from "@/lib/experiments";
import type { ConceptKey } from "@/content/apply/concepts";
import type { Market } from "@/content/apply/offer";
import type { Utm } from "./validate";

export const LP_LEAD_EVENTS = ["lp_email_captured", "lp_application_submitted", "lp_call_booked"] as const;
export type LpLeadEvent = (typeof LP_LEAD_EVENTS)[number];

export type LpContext = {
  lp_variant: Variant;
  concept: ConceptKey;
  market: Market;
  qa: boolean;
  utm: Utm;
};

/** The fields every /apply event carries (Phase 3). */
export function lpDetail(ctx: LpContext, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    lp_variant: ctx.lp_variant,
    experiment_id: EXPERIMENT_ID,
    concept: ctx.concept,
    market: ctx.market,
    qa: ctx.qa,
    ...ctx.utm,
    ...extra,
  };
}

/** "Column missing" (Postgres / PostgREST): lp_variants_v1.sql not run yet. */
const SCHEMA_NOT_READY = new Set(["42703", "PGRST204"]);

/**
 * Find or create the lead for `email` and tag it with the experiment (first touch:
 * an existing lead keeps any lp_variant it already has). Returns the lead id or null.
 * Falls back to a plain lead if lp_variants_v1.sql hasn't been run, so no email is lost.
 */
export async function upsertApplyLead(
  admin: SupabaseClient,
  email: string,
  ctx: LpContext,
  sessionKey: string | null,
): Promise<string | null> {
  try {
    const tagged = {
      lp_variant: ctx.lp_variant,
      experiment_id: EXPERIMENT_ID,
      concept: ctx.concept,
      market: ctx.market,
    };
    let up = await admin.from("leads").upsert(
      {
        email,
        // No new source value: widening the CHECK would need a DROP CONSTRAINT.
        // /apply leads are the ones with experiment_id set.
        source: "website_form",
        session_key: sessionKey,
        utm_source: ctx.utm.utm_source,
        utm_medium: ctx.utm.utm_medium,
        utm_campaign: ctx.utm.utm_campaign,
        utm_content: ctx.utm.utm_content,
        utm_term: ctx.utm.utm_term,
        ...tagged,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    let schemaReady = true;
    if (up.error && SCHEMA_NOT_READY.has(up.error.code ?? "")) {
      schemaReady = false;
      console.error("[apply] leads schema not ready (run supabase/sql/lp_variants_v1.sql), code", up.error.code);
      up = await admin.from("leads").upsert({ email, source: "website_form" }, { onConflict: "email", ignoreDuplicates: true });
    }
    if (up.error) {
      console.error("[apply] lead upsert failed, code", up.error.code);
      return null;
    }
    if (schemaReady) {
      // Existing lead from another source: tag it only if it was never tagged.
      const tag = await admin.from("leads").update(tagged).eq("email", email).is("lp_variant", null);
      if (tag.error) console.error("[apply] lead tag failed, code", tag.error.code);
    }
    const sel = await admin.from("leads").select("id").eq("email", email).maybeSingle();
    if (sel.error) {
      console.error("[apply] lead lookup failed, code", sel.error.code);
      return null;
    }
    return (sel.data as { id?: string } | null)?.id ?? null;
  } catch {
    console.error("[apply] upsertApplyLead failed: unexpected error");
    return null;
  }
}

export async function recordLpEvent(
  admin: SupabaseClient,
  evt: { leadId: string; type: LpLeadEvent; ctx: LpContext; extra?: Record<string, unknown>; dedupeKey?: string },
): Promise<void> {
  try {
    const ins = await admin.from("lead_events").insert({
      lead_id: evt.leadId,
      type: evt.type,
      detail: lpDetail(evt.ctx, evt.extra),
      source: "website",
      dedupe_key: evt.dedupeKey ?? null,
    });
    // 23505 = the dedupe key already exists: a replay, not an error.
    if (ins.error && ins.error.code !== "23505") console.error("[apply] lead event insert failed, code", ins.error.code);
  } catch {
    console.error("[apply] recordLpEvent failed: unexpected error");
  }
}

/** Saves the application answers on the lead (id and email must match). Falls back to notes if the new columns are missing. */
export async function saveApplication(
  admin: SupabaseClient,
  leadId: string,
  email: string,
  answers: Record<string, string>,
): Promise<boolean> {
  try {
    const name = answers.first_name || null;
    const res = await admin
      .from("leads")
      .update({ application: answers, application_submitted_at: new Date().toISOString(), ...(name ? { name } : {}) })
      .eq("id", leadId)
      .eq("email", email)
      .select("id");
    // The id and email must match the same lead, so a guessed id can't overwrite someone else's.
    if (!res.error) return (res.data?.length ?? 0) > 0;
    if (!SCHEMA_NOT_READY.has(res.error.code ?? "")) {
      console.error("[apply] application save failed, code", res.error.code);
      return false;
    }
    console.error("[apply] leads.application missing (run lp_variants_v1.sql); saving to notes, code", res.error.code);
    const fb = await admin
      .from("leads")
      .update({ notes: `Application ${new Date().toISOString()}\n${JSON.stringify(answers)}`, ...(name ? { name } : {}) })
      .eq("id", leadId)
      .eq("email", email)
      .select("id");
    if (fb.error) console.error("[apply] application fallback failed, code", fb.error.code);
    return !fb.error && (fb.data?.length ?? 0) > 0;
  } catch {
    console.error("[apply] saveApplication failed: unexpected error");
    return false;
  }
}
