/** Edit, tick/untick or delete a task. */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { validDate } from "@/lib/notes/parse";
import type { NoteTask } from "@/types/notes";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["text", "due_on", "done"]);

function parsePatch(body: unknown): Record<string, unknown> | string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "Body must be a JSON object";
  }
  const b = body as Record<string, unknown>;
  const keys = Object.keys(b);
  if (keys.length === 0) return "Nothing to update";
  const unknown = keys.filter((k) => !ALLOWED.has(k));
  if (unknown.length) return `Unknown field(s): ${unknown.join(", ")}`;

  const patch: Record<string, unknown> = {};
  if ("text" in b) {
    if (typeof b.text !== "string" || !b.text.trim()) return "text must be a non-empty string";
    patch.text = b.text.trim();
  }
  if ("due_on" in b) {
    if (b.due_on === null) patch.due_on = null;
    else {
      const d = validDate(b.due_on);
      if (!d) return "due_on must be YYYY-MM-DD or null";
      patch.due_on = d;
    }
  }
  if ("done" in b) {
    if (typeof b.done !== "boolean") return "done must be a boolean";
    patch.done_at = b.done ? new Date().toISOString() : null;
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

  const { data: task, error } = await supabase
    .from("note_tasks")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .maybeSingle<NoteTask>();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("note_tasks")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data?.length) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
