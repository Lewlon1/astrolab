/**
 * Supabase-facing helpers for the Daily Actions routes.
 *
 * Kept out of lib/actionEngine.ts so the ranking engine stays pure and
 * data-free, and out of the route files because Next.js only permits HTTP verb
 * exports there.
 */

import type { createClient } from "@/lib/supabase/server";
import {
  BATCH_SIZE,
  computeSuppressedKeys,
  generateBatch,
  type EngineInput,
} from "@/lib/actionEngine";
import { groupEventsByLead, loadWeights, scoreAndRank } from "@/lib/leadScoring";
import type {
  ActionItem,
  EngagementAccount,
  Lead,
  LeadEvent,
  RitualCalendarItem,
  TankStatus,
} from "@/types";

export type Supa = Awaited<ReturnType<typeof createClient>>;

/** Local (Europe/Madrid) date — Gabs's day, not UTC's. */
export function todayInMadrid(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

export function yesterdayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Expire anything left pending from a previous day, so it feeds back into
 * today's ranking instead of lingering.
 */
export async function expireStale(supabase: Supa, today: string): Promise<void> {
  await supabase
    .from("action_items")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("generated_for", today);
}

export async function buildEngineInput(
  supabase: Supa,
  today: string
): Promise<EngineInput> {
  const [{ data: leads }, { data: rituals }, { data: targets }] =
    await Promise.all([
      supabase.from("leads").select("*").returns<Lead[]>(),
      supabase
        .from("ritual_calendar")
        .select("*")
        .eq("active", true)
        .returns<RitualCalendarItem[]>(),
      supabase
        .from("engagement_accounts")
        .select("*")
        .eq("is_active", true)
        .returns<EngagementAccount[]>(),
    ]);

  const leadIds = (leads ?? []).map((l) => l.id);
  let events: LeadEvent[] = [];
  if (leadIds.length > 0) {
    const { data } = await supabase
      .from("lead_events")
      .select("*")
      .in("lead_id", leadIds)
      .returns<LeadEvent[]>();
    events = data ?? [];
  }

  const weights = await loadWeights(supabase);
  const scoredLeads = scoreAndRank(
    leads ?? [],
    groupEventsByLead(events),
    weights
  );

  // Everything already served today, so regeneration never repeats an action.
  const { data: todays } = await supabase
    .from("action_items")
    .select("dedupe_key")
    .eq("generated_for", today)
    .returns<{ dedupe_key: string }[]>();

  // Skip history drives the 7-day suppression.
  const { data: skips } = await supabase
    .from("action_items")
    .select("dedupe_key, created_at")
    .eq("status", "skipped")
    .returns<{ dedupe_key: string; created_at: string }[]>();

  // Accounts engaged yesterday are held back a day.
  const { data: yesterdayEngagement } = await supabase
    .from("action_items")
    .select("target_id")
    .eq("generated_for", yesterdayOf(today))
    .eq("tier", 3)
    .returns<{ target_id: string | null }[]>();

  const yesterdayIds = new Set(
    (yesterdayEngagement ?? []).map((r) => r.target_id).filter(Boolean)
  );
  const engagedYesterday = new Set(
    (targets ?? [])
      .filter((t) => yesterdayIds.has(t.id))
      .map((t) => t.handle.toLowerCase())
  );

  return {
    scoredLeads,
    rituals: rituals ?? [],
    targets: targets ?? [],
    today,
    usedKeys: new Set((todays ?? []).map((r) => r.dedupe_key)),
    suppressedKeys: computeSuppressedKeys(skips ?? []),
    engagedYesterday,
  };
}

/** Loads a day's items and derives the batch envelope the UI renders. */
export async function loadBatch(supabase: Supa, today: string) {
  const { data: items } = await supabase
    .from("action_items")
    .select("*")
    .eq("generated_for", today)
    .order("batch")
    .order("tier")
    .order("created_at")
    .returns<ActionItem[]>();

  const all = items ?? [];
  const latestBatch = all.reduce((max, i) => Math.max(max, i.batch), 1);
  const current = all.filter((i) => i.batch === latestBatch);

  return { all, latestBatch, current };
}

export function sumMinutes(items: ActionItem[]): number {
  return items.reduce((sum, i) => sum + (i.est_minutes ?? 0), 0);
}

export interface TodayBatch {
  date: string;
  batch: number;
  items: ActionItem[];
  totalMinutes: number;
  tank: TankStatus;
  canRegenerate: boolean;
  batchSize: number;
}

/**
 * Today's batch, generating batch 1 on the first call of the day. Shared by
 * GET /api/admin/actions and the admin home screen, so opening either one
 * produces the day's actions. Idempotent per (generated_for, dedupe_key).
 */
export async function getOrCreateTodayBatch(supabase: Supa): Promise<TodayBatch> {
  const today = todayInMadrid();
  await expireStale(supabase, today);

  const existing = await loadBatch(supabase, today);

  // A batch already exists — return it untouched. This is the refresh path.
  // The engine still runs, but only to recompute the tank status.
  if (existing.all.length > 0) {
    const input = await buildEngineInput(supabase, today);
    const preview = generateBatch(input);

    return {
      date: today,
      batch: existing.latestBatch,
      items: existing.current,
      totalMinutes: sumMinutes(existing.current),
      tank: preview.tank,
      canRegenerate:
        existing.current.length > 0 &&
        existing.current.every((i) => i.status === "done" || i.status === "skipped"),
      batchSize: BATCH_SIZE,
    };
  }

  // First request of the day — generate batch 1.
  const input = await buildEngineInput(supabase, today);
  const generated = generateBatch(input);

  if (generated.items.length === 0) {
    return {
      date: today,
      batch: 1,
      items: [],
      totalMinutes: 0,
      tank: generated.tank,
      canRegenerate: false,
      batchSize: BATCH_SIZE,
    };
  }

  const { error } = await supabase.from("action_items").upsert(
    generated.items.map((i) => ({
      ...i,
      status: "pending",
      generated_for: today,
      batch: 1,
    })),
    { onConflict: "generated_for,dedupe_key", ignoreDuplicates: true }
  );

  if (error) throw new Error(error.message);

  const saved = await loadBatch(supabase, today);

  return {
    date: today,
    batch: saved.latestBatch,
    items: saved.current,
    totalMinutes: sumMinutes(saved.current),
    tank: generated.tank,
    canRegenerate: false,
    batchSize: BATCH_SIZE,
  };
}
