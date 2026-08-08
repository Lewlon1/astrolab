/**
 * Daily Actions: fetch today's batch, generating batch 1 on the first request
 * of the day. Refreshes return the existing batch — generation is idempotent
 * per (generated_for, dedupe_key), enforced by a unique index.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BATCH_SIZE, generateBatch } from "@/lib/actionEngine";
import {
  buildEngineInput,
  expireStale,
  loadBatch,
  sumMinutes,
  todayInMadrid,
} from "@/lib/dailyActions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const today = todayInMadrid();
  await expireStale(supabase, today);

  const existing = await loadBatch(supabase, today);

  // A batch already exists — return it untouched. This is the refresh path.
  // The engine still runs, but only to recompute the tank status.
  if (existing.all.length > 0) {
    const input = await buildEngineInput(supabase, today);
    const preview = generateBatch(input);

    return NextResponse.json({
      date: today,
      batch: existing.latestBatch,
      items: existing.current,
      totalMinutes: sumMinutes(existing.current),
      tank: preview.tank,
      canRegenerate:
        existing.current.length > 0 &&
        existing.current.every(
          (i) => i.status === "done" || i.status === "skipped"
        ),
      batchSize: BATCH_SIZE,
    });
  }

  // First request of the day — generate batch 1.
  const input = await buildEngineInput(supabase, today);
  const generated = generateBatch(input);

  if (generated.items.length === 0) {
    return NextResponse.json({
      date: today,
      batch: 1,
      items: [],
      totalMinutes: 0,
      tank: generated.tank,
      canRegenerate: false,
      batchSize: BATCH_SIZE,
    });
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const saved = await loadBatch(supabase, today);

  return NextResponse.json({
    date: today,
    batch: saved.latestBatch,
    items: saved.current,
    totalMinutes: sumMinutes(saved.current),
    tank: generated.tank,
    canRegenerate: false,
    batchSize: BATCH_SIZE,
  });
}
