/**
 * Complete or skip a single action.
 *
 * Completing a lead-linked action writes a `lead_events` row of type `actioned`
 * so scoring learns from what actually got done.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPPRESSION_DAYS } from "@/lib/actionEngine";
import type { ActionItem } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as string | undefined;

  if (status !== "done" && status !== "skipped") {
    return NextResponse.json(
      { error: 'status must be "done" or "skipped"' },
      { status: 400 }
    );
  }

  const { data: action, error: readError } = await supabase
    .from("action_items")
    .select("*")
    .eq("id", params.id)
    .single<ActionItem>();

  if (readError || !action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("action_items")
    .update({
      status,
      completed_at: status === "done" ? now : null,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let suppressedUntil: string | null = null;

  if (status === "done") {
    if (action.lead_id) {
      // Scoring reads this back — completions are how the queue learns.
      await supabase.from("lead_events").insert({
        lead_id: action.lead_id,
        type: "actioned",
        source: "admin",
        detail: { action_type: action.type, tier: action.tier, title: action.title },
        occurred_at: now,
        dedupe_key: `action:${action.id}`,
      });

      await supabase
        .from("leads")
        .update({ last_actioned_at: now })
        .eq("id", action.lead_id);
    }

    if (action.target_id) {
      await supabase
        .from("engagement_accounts")
        .update({ last_engaged_at: action.generated_for })
        .eq("id", action.target_id);
    }
  } else {
    // Second skip of the same action buys it a rest.
    const { data: priorSkips } = await supabase
      .from("action_items")
      .select("id")
      .eq("dedupe_key", action.dedupe_key)
      .eq("status", "skipped")
      .returns<{ id: string }[]>();

    if ((priorSkips?.length ?? 0) >= 2) {
      const until = new Date();
      until.setDate(until.getDate() + SUPPRESSION_DAYS);
      suppressedUntil = until.toISOString().slice(0, 10);
    }
  }

  return NextResponse.json({ success: true, status, suppressedUntil });
}
