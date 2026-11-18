import { NOTE_AREAS, type NoteArea } from "@/types/notes";

export interface ParsedTask {
  text: string;
  due_on: string | null;
}

export interface ParsedNote {
  area: NoteArea;
  title: string;
  body: string;
  client_name: string | null;
  written_on: string | null;
  tasks: ParsedTask[];
}

export interface ParsedCapture {
  transcript: string;
  notes: ParsedNote[];
}

const TITLE_MAX = 80;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** A real calendar date as YYYY-MM-DD, else null. */
export function validDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) === s ? s : null;
}

function toArea(v: unknown): NoteArea {
  const key = typeof v === "string" ? v.trim().toLowerCase() : "";
  return (NOTE_AREAS as readonly string[]).includes(key) ? (key as NoteArea) : "unsorted";
}

function fallbackNote(title: string, body: string): ParsedNote {
  return {
    area: "unsorted",
    title,
    body,
    tasks: [],
    client_name: null,
    written_on: null,
  };
}

function parseTasks(v: unknown): ParsedTask[] {
  if (!Array.isArray(v)) return [];
  const out: ParsedTask[] = [];
  for (const t of v) {
    if (!isRecord(t)) continue;
    const text = str(t.text);
    if (!text) continue;
    out.push({ text, due_on: validDate(t.due_on) });
  }
  return out;
}

function parseNote(n: Record<string, unknown>): ParsedNote {
  const body = str(n.body);
  let title = str(n.title).slice(0, TITLE_MAX).trim();
  if (!title) {
    title = (body.split("\n")[0] ?? "").trim().slice(0, TITLE_MAX).trim();
  }
  if (!title) title = "Untitled page";
  return {
    area: toArea(n.area),
    title,
    body,
    client_name: str(n.client_name) || null,
    written_on: validDate(n.written_on),
    tasks: parseTasks(n.tasks),
  };
}

function stripFences(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : t;
}

/** JSON.parse, retrying on the outermost {...} if the model wrapped it in prose. */
function parseLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) throw e;
    return JSON.parse(text.slice(start, end + 1));
  }
}

/** Turns the model's JSON output into safe, typed notes. Never throws. */
export function parseCaptureResponse(raw: string): ParsedCapture {
  const input = typeof raw === "string" ? raw : "";
  try {
    let data: unknown;
    try {
      data = parseLoose(stripFences(input));
    } catch {
      return { transcript: input, notes: [fallbackNote("Unreadable page", input)] };
    }
    if (!isRecord(data)) {
      return { transcript: input, notes: [fallbackNote("Unreadable page", input)] };
    }

    const transcript = typeof data.transcript === "string" ? data.transcript.trim() : "";
    const notes = Array.isArray(data.notes)
      ? data.notes.filter(isRecord).map(parseNote)
      : [];

    if (notes.length > 0) return { transcript, notes };
    if (transcript) {
      return { transcript, notes: [fallbackNote("Untitled page", transcript)] };
    }
    return { transcript: input, notes: [fallbackNote("Unreadable page", input)] };
  } catch {
    return { transcript: input, notes: [fallbackNote("Unreadable page", input)] };
  }
}
