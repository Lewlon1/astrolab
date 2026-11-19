// Server-only by convention. Called from the Cal webhook after the normal booking sync.
// Additive: only acts on bookings whose metadata came from /apply. Never throws.
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPERIMENT_ID } from "@/lib/experiments";
import { parseLpBooking } from "./cal";
import { recordLpEvent } from "./events";

export async function recordLpBooking(admin: SupabaseClient, body: unknown): Promise<void> {
  try {
    const b = parseLpBooking(body);
    if (!b) return;
    await recordLpEvent(admin, {
      leadId: b.leadId,
      type: "lp_call_booked",
      // qa isn't carried through Cal; the readout takes it from the lead's earlier events.
      ctx: { lp_variant: b.lp_variant, concept: b.concept, market: b.market, qa: false, utm: b.utm },
      extra: { cal_uid: b.uid },
      dedupeKey: `lp_call_booked:${b.uid}`,
    });
    const up = await admin
      .from("bookings")
      .update({ lead_id: b.leadId, lp_variant: b.lp_variant, experiment_id: EXPERIMENT_ID, concept: b.concept, market: b.market })
      .eq("cal_uid", b.uid);
    if (up.error) console.error("[apply] booking attribution failed, code", up.error.code);
  } catch {
    console.error("[apply] recordLpBooking failed: unexpected error");
  }
}
