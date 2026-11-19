"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Note, NoteArea, NoteTask } from "@/types/notes";
import AreaChip from "./AreaChip";

async function send(url: string, method: "PATCH" | "DELETE", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Error ${res.status}`);
  }
}

export function formatDue(due: string): string {
  return new Date(`${due}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** A new note waiting for review: change the area (files it) or tap Looks right. */
export default function InboxCard({ note, tasks }: { note: Note; tasks: NoteTask[] }) {
  const router = useRouter();
  const [area, setArea] = useState<NoteArea>(note.area);
  const [list, setList] = useState(tasks);
  const [filed, setFiled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const fileAs = (patch: { area?: NoteArea; status?: "filed" }) =>
    run(async () => {
      await send(`/api/admin/notes/${note.id}`, "PATCH", patch);
      if (patch.area) setArea(patch.area);
      setFiled(true);
      router.refresh();
    });

  const tick = (t: NoteTask) =>
    run(async () => {
      const done = !t.done_at;
      await send(`/api/admin/notes/tasks/${t.id}`, "PATCH", { done });
      setList((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, done_at: done ? new Date().toISOString() : null } : x))
      );
    });

  const remove = (t: NoteTask) =>
    run(async () => {
      await send(`/api/admin/notes/tasks/${t.id}`, "DELETE");
      setList((prev) => prev.filter((x) => x.id !== t.id));
    });

  if (filed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
        Filed &ldquo;{note.title || "Untitled"}&rdquo;
      </div>
    );
  }

  const preview = note.body.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n");

  return (
    <article className="bg-white border border-[#e8e5df] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <AreaChip area={area} onChange={(a) => fileAs({ area: a })} disabled={busy} />
        {note.client_name && <span className="text-xs text-[#6b6560] truncate">{note.client_name}</span>}
      </div>

      <Link href={`/admin/notes/${note.id}`} className="block group">
        <h3 className="font-medium text-[#1a1a18] group-hover:underline">{note.title || "Untitled"}</h3>
        {preview && (
          <p className="text-sm text-[#6b6560] mt-1 whitespace-pre-line line-clamp-3">{preview}</p>
        )}
      </Link>

      {list.length > 0 && (
        <ul className="space-y-1">
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => tick(t)}
                disabled={busy}
                aria-label={t.done_at ? "Mark not done" : "Mark done"}
                className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs ${
                  t.done_at ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#d6d1c8] bg-white"
                }`}
              >
                {t.done_at ? "✓" : ""}
              </button>
              <span className={`flex-1 text-sm ${t.done_at ? "line-through text-[#b8b0a4]" : "text-[#1a1a18]"}`}>
                {t.text}
                {t.due_on && <span className="text-xs text-[#6b6560]"> · {formatDue(t.due_on)}</span>}
              </span>
              <button
                type="button"
                onClick={() => remove(t)}
                disabled={busy}
                aria-label="Delete task"
                className="shrink-0 w-8 h-8 text-[#b8b0a4] hover:text-[#6b6560]"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => fileAs({ status: "filed" })}
          disabled={busy}
          className="bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          Looks right
        </button>
        <Link href={`/admin/notes/${note.id}`} className="text-sm text-[#6b6560] underline">
          Edit
        </Link>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </article>
  );
}
