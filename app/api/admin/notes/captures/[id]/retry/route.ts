/**
 * Re-run a failed capture on its stored photos. Only a failed (or stale
 * processing) capture may be retried — a retry replaces the capture's notes, so
 * a done capture's (possibly reviewed) notes and a running retry get a 409.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { processCapture } from "@/lib/notes/process";
import { liveDeps } from "@/lib/notes/liveDeps";
import { STALE_MS } from "@/lib/notes/status";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  // Claim the capture atomically: only a failed (or stale-processing) capture
  // flips to processing, so a second Try-again tap during a run gets a 409.
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_MS).toISOString();
  const { data: claimed, error } = await supabase
    .from("note_captures")
    .update({ status: "processing", started_at: now.toISOString(), error: null })
    .eq("id", params.id)
    .or(
      `status.eq.failed,and(status.eq.processing,started_at.lt."${staleBefore}")`
    )
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!claimed?.length) {
    const { data: exists } = await supabase
      .from("note_captures")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();
    return exists
      ? NextResponse.json(
          { error: "Only a failed capture can be retried" },
          { status: 409 }
        )
      : NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }
  const result = await processCapture(liveDeps(supabase), params.id);
  return NextResponse.json(
    result.ok
      ? { capture_id: params.id, ok: true }
      : { capture_id: params.id, ok: false, error: result.error }
  );
}
