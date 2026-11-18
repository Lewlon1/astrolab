import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processCapture, type ProcessDeps } from "./process";

type Row = Record<string, unknown>;

/**
 * Minimal in-memory Supabase: only the calls process.ts makes —
 * from().select().eq().single(), from().delete().eq(),
 * from().insert().select().single(), from().insert(rows), from().update().eq(),
 * storage.from().download().
 */
function fakeSupabase(seed: { captures: Row[]; files: Record<string, string> }) {
  const tables: Record<string, Row[]> = {
    note_captures: seed.captures.map((c) => ({ ...c })),
    notes: [],
    note_tasks: [],
  };
  let seq = 0;

  function from(table: string) {
    const rows = tables[table];
    let op: "select" | "delete" | "insert" | "update" = "select";
    let payload: Row | Row[] | null = null;
    let filter: [string, unknown] | null = null;
    let returning = false;

    const run = (): { data: unknown; error: { message: string } | null } => {
      const match = (r: Row) => !filter || r[filter[0]] === filter[1];
      if (op === "insert") {
        const list = (Array.isArray(payload) ? payload : [payload]) as Row[];
        const inserted = list.map((r) => ({ id: `${table}-${++seq}`, ...r }));
        rows.push(...inserted);
        return { data: returning ? inserted : null, error: null };
      }
      if (op === "delete") {
        const gone = rows.filter(match);
        tables[table] = rows.filter((r) => !match(r));
        if (table === "notes") {
          const ids = new Set(gone.map((n) => n.id));
          tables.note_tasks = tables.note_tasks.filter((t) => !ids.has(t.note_id));
        }
        return { data: null, error: null };
      }
      if (op === "update") {
        rows.filter(match).forEach((r) => Object.assign(r, payload));
        return { data: null, error: null };
      }
      return { data: rows.filter(match), error: null };
    };

    const builder = {
      select() {
        if (op !== "select") returning = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        filter = [col, val];
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      insert(p: Row | Row[]) {
        op = "insert";
        payload = p;
        return builder;
      },
      update(p: Row) {
        op = "update";
        payload = p;
        return builder;
      },
      single() {
        const { data, error } = run();
        const list = data as Row[];
        if (error || list.length !== 1) {
          return Promise.resolve({ data: null, error: error ?? { message: "not found" } });
        }
        return Promise.resolve({ data: list[0], error: null });
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(run()).then(resolve, reject);
      },
    };
    return builder;
  }

  const storage = {
    from: () => ({
      download: async (path: string) =>
        path in seed.files
          ? { data: new Blob([seed.files[path]]), error: null }
          : { data: null, error: { message: `Object not found: ${path}` } },
    }),
  };

  return { client: { from, storage } as unknown as SupabaseClient, tables };
}

const MODEL_JSON = JSON.stringify({
  transcript: "Call Marta re: Saturn return\nReel idea: Venus retrograde",
  notes: [
    {
      area: "clients",
      title: "Marta follow-up",
      body: "Call Marta re: Saturn return",
      client_name: "Marta",
      written_on: "2026-11-17",
      tasks: [{ text: "Call Marta", due_on: "2026-11-20" }],
    },
    {
      area: "content",
      title: "Venus retrograde reel",
      body: "Reel idea: Venus retrograde",
      client_name: null,
      written_on: null,
      tasks: [],
    },
  ],
});

function setup(opts: { transcribe?: ProcessDeps["transcribe"]; files?: Record<string, string> } = {}) {
  const fake = fakeSupabase({
    captures: [
      { id: "cap-1", photo_paths: ["captures/a.jpg", "captures/b.jpg"], status: "processing", error: null },
    ],
    files: opts.files ?? { "captures/a.jpg": "img-a", "captures/b.jpg": "img-b" },
  });
  const calls: { images: number; date: string }[] = [];
  const deps: ProcessDeps = {
    supabase: fake.client,
    model: "test-model",
    today: () => "2026-11-18",
    transcribe:
      opts.transcribe ??
      (async (images, date) => {
        calls.push({ images: images.length, date });
        return MODEL_JSON;
      }),
  };
  return { ...fake, deps, calls };
}

describe("processCapture", () => {
  it("writes notes and tasks and marks capture done", async () => {
    const { deps, tables, calls } = setup();
    const res = await processCapture(deps, "cap-1");

    expect(res.ok).toBe(true);
    expect(res.ok && res.noteIds).toHaveLength(2);
    expect(calls).toEqual([{ images: 2, date: "2026-11-18" }]);

    expect(tables.notes).toHaveLength(2);
    const marta = tables.notes.find((n) => n.title === "Marta follow-up")!;
    expect(marta).toMatchObject({
      capture_id: "cap-1",
      area: "clients",
      ai_area: "clients",
      status: "inbox",
      client_name: "Marta",
      written_on: "2026-11-17",
    });
    expect(tables.note_tasks).toEqual([
      expect.objectContaining({ note_id: marta.id, text: "Call Marta", due_on: "2026-11-20" }),
    ]);

    const cap = tables.note_captures[0];
    expect(cap.status).toBe("done");
    expect(cap.error).toBeNull();
    expect(cap.model).toBe("test-model");
    expect(cap.raw_transcript).toContain("Saturn return");
    expect(typeof cap.processed_at).toBe("string");
  });

  it("retry replaces earlier notes for the same capture", async () => {
    const { deps, tables } = setup();
    await processCapture(deps, "cap-1");
    const res = await processCapture(deps, "cap-1");

    expect(res.ok).toBe(true);
    expect(tables.notes).toHaveLength(2);
    expect(tables.note_tasks).toHaveLength(1);
  });

  it("marks capture failed and keeps photo_paths when transcribe throws", async () => {
    const { deps, tables } = setup({
      transcribe: async () => {
        throw new Error("Bedrock throttled");
      },
    });
    const res = await processCapture(deps, "cap-1");

    expect(res).toEqual({ ok: false, error: expect.stringContaining("Bedrock throttled") });
    const cap = tables.note_captures[0];
    expect(cap.status).toBe("failed");
    expect(cap.error).toContain("Bedrock throttled");
    expect(cap.photo_paths).toEqual(["captures/a.jpg", "captures/b.jpg"]);
    expect(tables.notes).toHaveLength(0);
  });

  it("marks failed when a photo cannot be downloaded", async () => {
    const { deps, tables, calls } = setup({ files: { "captures/a.jpg": "img-a" } });
    const res = await processCapture(deps, "cap-1");

    expect(res.ok).toBe(false);
    expect(calls).toHaveLength(0);
    const cap = tables.note_captures[0];
    expect(cap.status).toBe("failed");
    expect(cap.error).toContain("captures/b.jpg");
    expect(cap.photo_paths).toEqual(["captures/a.jpg", "captures/b.jpg"]);
  });
});
