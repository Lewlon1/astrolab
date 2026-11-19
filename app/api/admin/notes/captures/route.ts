/**
 * Create a capture from photos already uploaded to the note-photos bucket,
 * then transcribe it in the same request.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { MODELS } from "@/lib/bedrock";
import { processCapture } from "@/lib/notes/process";
import { liveDeps } from "@/lib/notes/liveDeps";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PHOTOS = 6;

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const body = await req.json().catch(() => null);
  const paths: unknown = body?.photo_paths;

  if (
    !Array.isArray(paths) ||
    paths.length === 0 ||
    paths.length > MAX_PHOTOS ||
    !paths.every(
      (p) => typeof p === "string" && p.startsWith("captures/") && !p.includes("..")
    )
  ) {
    return NextResponse.json(
      { error: `photo_paths must be 1-${MAX_PHOTOS} paths under captures/` },
      { status: 400 }
    );
  }

  const { data: capture, error } = await supabase
    .from("note_captures")
    .insert({ photo_paths: paths, status: "processing", model: MODELS.SONNET })
    .select("id")
    .single<{ id: string }>();

  if (error || !capture) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create capture" },
      { status: 500 }
    );
  }

  const result = await processCapture(liveDeps(supabase), capture.id);
  return NextResponse.json(
    result.ok
      ? { capture_id: capture.id, ok: true }
      : { capture_id: capture.id, ok: false, error: result.error }
  );
}
