/**
 * Re-run a failed capture on its stored photos. Only failed captures may be
 * retried — a retry replaces the capture's notes, so a done capture's
 * (possibly reviewed) notes are protected with a 409.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { processCapture } from "@/lib/notes/process";
import { liveDeps } from "@/lib/notes/liveDeps";
import { effectiveStatus } from "@/lib/notes/status";
import type { NoteCapture } from "@/types/notes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data: capture } = await supabase
    .from("note_captures")
    .select("id, status, created_at")
    .eq("id", params.id)
    .maybeSingle<Pick<NoteCapture, "id" | "status" | "created_at">>();

  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }
  if (effectiveStatus(capture) !== "failed") {
    return NextResponse.json(
      { error: "Only a failed capture can be retried" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("note_captures")
    .update({ status: "processing", error: null })
    .eq("id", capture.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = await processCapture(liveDeps(supabase), capture.id);
  return NextResponse.json(
    result.ok
      ? { capture_id: capture.id, ok: true }
      : { capture_id: capture.id, ok: false, error: result.error }
  );
}
