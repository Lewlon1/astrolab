/** Edit or delete a note. Re-filing an inbox note (changing its area) files it. */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { NOTE_AREAS, type Note, type NoteStatus } from "@/types/notes";

export const dynamic = "force-dynamic";

const NOTE_STATUSES: readonly NoteStatus[] = ["inbox", "filed", "archived"];
const ALLOWED = new Set(["area", "title", "body", "client_name", "status"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validates a PATCH body; returns the patch or an error message. */
function parsePatch(body: unknown): Record<string, unknown> | string {
  if (!isRecord(body)) return "Body must be a JSON object";
  const keys = Object.keys(body);
  if (keys.length === 0) return "Nothing to update";
  const unknown = keys.filter((k) => !ALLOWED.has(k));
  if (unknown.length) return `Unknown field(s): ${unknown.join(", ")}`;

  const patch: Record<string, unknown> = {};
  if ("area" in body) {
    if (!(NOTE_AREAS as readonly unknown[]).includes(body.area)) return "Invalid area";
    patch.area = body.area;
  }
  if ("status" in body) {
    if (!(NOTE_STATUSES as readonly unknown[]).includes(body.status)) return "Invalid status";
    patch.status = body.status;
  }
  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) return "title must be a non-empty string";
    patch.title = body.title.trim();
  }
  if ("body" in body) {
    if (typeof body.body !== "string") return "body must be a string";
    patch.body = body.body;
  }
  if ("client_name" in body) {
    if (body.client_name !== null && typeof body.client_name !== "string") {
      return "client_name must be a string or null";
    }
    patch.client_name =
      typeof body.client_name === "string" ? body.client_name.trim() || null : null;
  }
  return patch;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const patch = parsePatch(await req.json().catch(() => null));
  if (typeof patch === "string") {
    return NextResponse.json({ error: patch }, { status: 400 });
  }

  const { data: current } = await supabase
    .from("notes")
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle<Pick<Note, "id" | "status">>();
  if (!current) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Correcting the area of an inbox note is the review — it files the note.
  if ("area" in patch && !("status" in patch) && current.status === "inbox") {
    patch.status = "filed";
  }

  const { data: note, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .maybeSingle<Note>();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data?.length) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
