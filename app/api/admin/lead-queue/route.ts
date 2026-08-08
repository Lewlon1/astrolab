/**
 * Lead Queue read endpoint + scoring config.
 *
 * Scores are computed live on every request rather than cached in a column,
 * which is what makes acceptance criterion 6 hold: editing a weight reorders
 * the queue immediately, with no re-sync and no redeploy.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  groupEventsByLead,
  loadWeights,
  scoreAndRank,
} from "@/lib/leadScoring";
import type { Lead, LeadEvent, ScoringWeight } from "@/types";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const language = req.nextUrl.searchParams.get("language");
  const stage = req.nextUrl.searchParams.get("stage");

  let query = supabase.from("leads").select("*");
  if (language && language !== "all") query = query.eq("language", language);
  if (stage && stage !== "all") query = query.eq("status", stage);

  const { data: leads, error } = await query
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leadIds = (leads ?? []).map((l) => l.id);

  // `lead_events` may not exist yet if the SQL has not been run. Treat that as
  // "no behavioural data" rather than an error, so the queue still renders.
  let events: LeadEvent[] = [];
  if (leadIds.length > 0) {
    const { data } = await supabase
      .from("lead_events")
      .select("*")
      .in("lead_id", leadIds)
      .order("occurred_at", { ascending: false })
      .returns<LeadEvent[]>();
    events = data ?? [];
  }

  const weights = await loadWeights(supabase);
  const ranked = scoreAndRank(leads ?? [], groupEventsByLead(events), weights);

  const { data: config } = await supabase
    .from("lead_scoring_config")
    .select("*")
    .order("sort_order")
    .returns<ScoringWeight[]>();

  return NextResponse.json({
    leads: ranked,
    config: config ?? [],
    counts: {
      total: ranked.length,
      unworked: ranked.filter((r) => r.lead.status === "new").length,
    },
  });
}

/** Update scoring weights from the config panel. */
export async function PATCH(req: NextRequest) {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const updates = body?.weights as Record<string, number> | undefined;

  if (!updates || typeof updates !== "object") {
    return NextResponse.json(
      { error: "Expected { weights: { key: number } }" },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  for (const [key, raw] of Object.entries(updates)) {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors.push(`${key}: not a number`);
      continue;
    }
    const { error } = await supabase
      .from("lead_scoring_config")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) errors.push(`${key}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

/** Mark a lead actioned from the queue drawer. */
export async function POST(req: NextRequest) {
  const { supabase, user } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const leadId = body?.leadId as string | undefined;
  const status = body?.status as string | undefined;
  const note = body?.note as string | undefined;

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { last_actioned_at: now };
  if (status) patch.status = status;

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    type: "actioned",
    source: "admin",
    detail: { via: "queue", status: status ?? null, note: note ?? null },
    occurred_at: now,
  });

  return NextResponse.json({ success: true });
}
