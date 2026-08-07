/**
 * "Generate 10 more" — only permitted once every item in the current batch is
 * resolved. Same fill order, same constraints, and the same refusal to pad:
 * if only four real actions remain, four is what comes back.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBatch } from "@/lib/actionEngine";
import {
  buildEngineInput,
  loadBatch,
  sumMinutes,
  todayInMadrid,
} from "@/lib/dailyActions";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const today = todayInMadrid();
  const existing = await loadBatch(supabase, today);

  if (existing.current.length === 0) {
    return NextResponse.json(
      { error: "No batch to regenerate from — load today's actions first." },
      { status: 409 }
    );
  }

  const unresolved = existing.current.filter((i) => i.status === "pending");
  if (unresolved.length > 0) {
    return NextResponse.json(
      {
        error: `${unresolved.length} action${unresolved.length === 1 ? " is" : "s are"} still open. Finish or skip the current batch first.`,
      },
      { status: 409 }
    );
  }

  const input = await buildEngineInput(supabase, today);
  const generated = generateBatch(input);
  const nextBatch = existing.latestBatch + 1;

  if (generated.items.length === 0) {
    // Nothing left. Say so rather than manufacturing a batch.
    return NextResponse.json({
      date: today,
      batch: existing.latestBatch,
      items: existing.current,
      totalMinutes: sumMinutes(existing.current),
      tank: generated.tank,
      canRegenerate: false,
      exhausted: true,
    });
  }

  const { error } = await supabase.from("action_items").upsert(
    generated.items.map((i) => ({
      ...i,
      status: "pending",
      generated_for: today,
      batch: nextBatch,
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
    exhausted: false,
  });
}
