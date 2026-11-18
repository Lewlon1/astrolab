/**
 * Runs one capture through the model: download photos, transcribe, parse, write
 * notes + tasks. Retry-safe — earlier notes for the same capture are replaced.
 * On any error its notes are removed and the capture is marked `failed`
 * (photos kept) so the UI can retry.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCaptureResponse } from "./parse";

export const NOTE_PHOTOS_BUCKET = "note-photos";

export interface ProcessDeps {
  supabase: SupabaseClient;
  transcribe: (
    images: { bytes: Uint8Array; format: "jpeg" }[],
    captureDate: string
  ) => Promise<string>;
  today: () => string;
  /** Model id recorded on the capture. */
  model: string;
}

export type ProcessResult =
  | { ok: true; noteIds: string[] }
  | { ok: false; error: string };

export async function processCapture(
  deps: ProcessDeps,
  captureId: string
): Promise<ProcessResult> {
  const { supabase } = deps;

  try {
    const { data: capture, error: readError } = await supabase
      .from("note_captures")
      .select("id, photo_paths")
      .eq("id", captureId)
      .single<{ id: string; photo_paths: string[] }>();
    if (readError || !capture) {
      throw new Error(`Capture not found: ${readError?.message ?? captureId}`);
    }
    if (!capture.photo_paths?.length) throw new Error("Capture has no photos");

    const images: { bytes: Uint8Array; format: "jpeg" }[] = [];
    for (const path of capture.photo_paths) {
      const { data, error } = await supabase.storage
        .from(NOTE_PHOTOS_BUCKET)
        .download(path);
      if (error || !data) {
        throw new Error(`Could not download ${path}: ${error?.message ?? "no data"}`);
      }
      images.push({ bytes: new Uint8Array(await data.arrayBuffer()), format: "jpeg" });
    }

    const raw = await deps.transcribe(images, deps.today());
    const parsed = parseCaptureResponse(raw);

    // Retry idempotence: drop notes (and, by cascade, tasks) from an earlier run.
    const { error: clearError } = await supabase
      .from("notes")
      .delete()
      .eq("capture_id", captureId);
    if (clearError) throw new Error(`Could not clear earlier notes: ${clearError.message}`);

    const noteIds: string[] = [];
    for (const n of parsed.notes) {
      const { data: note, error } = await supabase
        .from("notes")
        .insert({
          capture_id: captureId,
          area: n.area,
          ai_area: n.area,
          title: n.title,
          body: n.body,
          client_name: n.client_name,
          written_on: n.written_on,
          status: "inbox",
        })
        .select("id")
        .single<{ id: string }>();
      if (error || !note) throw new Error(`Could not save note: ${error?.message ?? "no row"}`);
      noteIds.push(note.id);

      if (n.tasks.length > 0) {
        const { error: taskError } = await supabase.from("note_tasks").insert(
          n.tasks.map((t) => ({ note_id: note.id, text: t.text, due_on: t.due_on }))
        );
        if (taskError) throw new Error(`Could not save tasks: ${taskError.message}`);
      }
    }

    const { error: doneError } = await supabase
      .from("note_captures")
      .update({
        status: "done",
        error: null,
        raw_transcript: parsed.transcript,
        model: deps.model,
        processed_at: new Date().toISOString(),
      })
      .eq("id", captureId);
    if (doneError) throw new Error(`Could not mark capture done: ${doneError.message}`);

    return { ok: true, noteIds };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // A failed capture never keeps partial notes (their tasks cascade).
    try {
      await supabase.from("notes").delete().eq("capture_id", captureId);
    } catch {
      // Best effort; a retry clears them anyway.
    }
    try {
      await supabase
        .from("note_captures")
        .update({
          status: "failed",
          error: message.slice(0, 1000),
          processed_at: new Date().toISOString(),
        })
        .eq("id", captureId);
    } catch {
      // Nothing more we can do; effectiveStatus() will show it as failed once stale.
    }
    return { ok: false, error: message };
  }
}
