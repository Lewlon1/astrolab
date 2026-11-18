/** Add a task to a note by hand. */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { validDate } from "@/lib/notes/parse";
import type { NoteTask } from "@/types/notes";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["note_id", "text", "due_on"]);

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }
  const unknown = Object.keys(body).filter((k) => !ALLOWED.has(k));
  if (unknown.length) {
    return NextResponse.json({ error: `Unknown field(s): ${unknown.join(", ")}` }, { status: 400 });
  }
  if (typeof body.note_id !== "string" || !body.note_id) {
    return NextResponse.json({ error: "note_id is required" }, { status: 400 });
  }
  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "text must be a non-empty string" }, { status: 400 });
  }
  let due_on: string | null = null;
  if (body.due_on !== undefined && body.due_on !== null) {
    due_on = validDate(body.due_on);
    if (!due_on) {
      return NextResponse.json({ error: "due_on must be YYYY-MM-DD or null" }, { status: 400 });
    }
  }

  const { data: note } = await supabase
    .from("notes")
    .select("id")
    .eq("id", body.note_id)
    .maybeSingle();
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const { data: task, error } = await supabase
    .from("note_tasks")
    .insert({ note_id: body.note_id, text: body.text.trim(), due_on })
    .select("*")
    .single<NoteTask>();

  if (error || !task) {
    return NextResponse.json({ error: error?.message ?? "Could not add task" }, { status: 400 });
  }
  return NextResponse.json(task, { status: 201 });
}
