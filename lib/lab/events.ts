// Server-only by convention (the `server-only` package is not installed).
// Post-email funnel events, written to lead_events with the service-role client.
import type { SupabaseClient } from "@supabase/supabase-js";

export const LAB_LEAD_EVENTS = ["lab_email_submitted", "lab_profile_opened", "lab_booking_clicked"] as const;
export type LabLeadEvent = (typeof LAB_LEAD_EVENTS)[number];

class LeadEventError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

/**
 * Find or create the lead for `email` (source 'lab'), then log the event.
 * Never throws; returns the lead id, or null if it could not be resolved.
 * Logs fixed strings and error codes only, never the email or event detail.
 */
export async function recordLeadEvent(
  admin: SupabaseClient,
  evt: { email: string; type: LabLeadEvent; detail?: Record<string, unknown> }
): Promise<string | null> {
  try {
    const email = evt.email.trim().toLowerCase();
    const up = await admin
      .from("leads")
      .upsert({ email, source: "lab" }, { onConflict: "email", ignoreDuplicates: true });
    if (up.error) throw new LeadEventError("lead upsert failed", up.error.code);

    const sel = await admin.from("leads").select("id").eq("email", email).maybeSingle();
    if (sel.error) throw new LeadEventError("lead lookup failed", sel.error.code);
    const leadId = (sel.data as { id?: string } | null)?.id ?? null;
    if (!leadId) return null;

    const ins = await admin
      .from("lead_events")
      .insert({ lead_id: leadId, type: evt.type, detail: evt.detail ?? {}, source: "website" });
    if (ins.error) console.error("[lab] lead event insert failed, code", ins.error.code);
    return leadId;
  } catch (err) {
    // Fixed string + code only: Postgres messages can embed the email.
    console.error("[lab] recordLeadEvent failed:", err instanceof LeadEventError ? `${err.message} (code ${err.code})` : "unexpected error");
    return null;
  }
}
