/**
 * One lead, scored, with its timeline and attribution.
 *
 * This exists so the drawer can be opened from anywhere — a `?lead=<id>` deep
 * link out of a Daily Action lands on the Actions tab, which has no scored
 * leads in memory. Before this route, lib/actionEngine.ts emitted those links
 * and nothing read them.
 *
 * PATCH is the other half: the flat "All leads" table used to write straight to
 * Supabase from the browser, so a stage change there was invisible to the
 * scoring engine's recency penalty. Every write now goes through here and
 * leaves a lead_event behind.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadWeights, scoreLead } from "@/lib/leadScoring";
import { loadAttribution } from "@/lib/leadAttribution";
import { canAdvance, normalizeStage, STAGE_ORDER } from "@/lib/leadStages";
import type { Lead, LeadEvent } from "@/types";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Lead>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Tolerate lead_events not existing yet, the same way the queue route does.
  let events: LeadEvent[] = [];
  {
    const { data } = await supabase
      .from("lead_events")
      .select("*")
      .eq("lead_id", lead.id)
      .order("occurred_at", { ascending: false })
      .returns<LeadEvent[]>();
    events = data ?? [];
  }

  const weights = await loadWeights(supabase);
  const scored = scoreLead(lead, events, weights);

  const attribution = await loadAttribution(supabase, [lead]);

  return NextResponse.json({
    scored,
    attribution: attribution.get(lead.id) ?? null,
  });
}

/**
 * Update a lead's stage and/or notes.
 *
 * Stage moves are checked against `canAdvance` before the write. The database
 * trigger `trg_leads_no_stage_regression` is the real authority and would
 * silently clamp a backwards move — returning 409 here instead means the admin
 * finds out, rather than watching the dropdown snap back with no explanation.
 *
 * `override: true` is the deliberate correction path for a mis-set stage. It
 * sets stage_override_at, which is what unlocks the trigger.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const stage = body?.stage as string | undefined;
  const notes = body?.notes as string | undefined;
  const note = body?.note as string | undefined;
  const override = body?.override === true;
  const actioned = body?.actioned === true;
  const via = (body?.via as string | undefined) ?? "drawer";

  if (stage === undefined && notes === undefined && note === undefined && !actioned) {
    return NextResponse.json(
      { error: "Nothing to update. Expected stage, notes, note or actioned." },
      { status: 400 }
    );
  }

  if (stage !== undefined && !STAGE_ORDER.includes(normalizeStage(stage))) {
    return NextResponse.json({ error: `Unknown stage "${stage}"` }, { status: 400 });
  }

  const { data: current, error: readErr } = await supabase
    .from("leads")
    .select("id, status, track")
    .eq("id", params.id)
    .maybeSingle<Pick<Lead, "id" | "status" | "track">>();

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 400 });
  }
  if (!current) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  let stageChanged = false;

  if (stage !== undefined && normalizeStage(stage) !== normalizeStage(current.status)) {
    if (!canAdvance(current.status, stage) && !override) {
      return NextResponse.json(
        {
          error: `Stage cannot move backwards from "${normalizeStage(current.status)}" to "${normalizeStage(stage)}". Send override: true to correct a mis-set stage.`,
        },
        { status: 409 }
      );
    }
    patch.status = normalizeStage(stage);
    if (override) patch.stage_override_at = now;
    stageChanged = true;
  }

  if (notes !== undefined) patch.notes = notes;
  if (actioned) patch.last_actioned_at = now;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // The point of routing these writes through an API: the scoring engine can
  // only see a touch that left an event behind.
  if (stageChanged || actioned || note) {
    await supabase.from("lead_events").insert({
      lead_id: params.id,
      type: actioned ? "actioned" : "note",
      source: "admin",
      detail: {
        via,
        stage: stageChanged ? patch.status : null,
        from: stageChanged ? normalizeStage(current.status) : null,
        override: override || null,
        note: note ?? null,
      },
      occurred_at: now,
    });
  }

  return NextResponse.json({ success: true });
}
