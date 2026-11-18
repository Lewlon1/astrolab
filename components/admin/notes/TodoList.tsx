"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TodoWithNote } from "@/lib/notes/status";
import { formatDue } from "./InboxCard";

/** Open to-dos across all notes (already sorted by openTodos). Tick to complete. */
export default function TodoList({ todos, today }: { todos: TodoWithNote[]; today: string }) {
  const router = useRouter();
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function tick(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/notes/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? `Error ${res.status}`);
      }
      setTicked((prev) => new Set(prev).add(id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't tick that off");
    } finally {
      setBusy(null);
    }
  }

  const visible = todos.filter((t) => !ticked.has(t.id));

  if (visible.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 text-sm text-[#6b6560]">
        Nothing to do from your notes.
      </div>
    );
  }

  return (
    <section className="space-y-2">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <ul className="bg-white border border-[#e8e5df] rounded-xl divide-y divide-[#f0ede8]">
        {visible.map((t) => {
          const overdue = t.due_on !== null && t.due_on < today;
          const dueToday = t.due_on === today;
          return (
            <li key={t.id} className="flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => tick(t.id)}
                disabled={busy !== null}
                aria-label="Mark done"
                className="shrink-0 mt-0.5 w-6 h-6 rounded-md border border-[#d6d1c8] bg-white hover:border-emerald-500 disabled:opacity-60"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1a1a18]">{t.text}</p>
                <p className="text-xs text-[#6b6560] mt-0.5 flex flex-wrap gap-x-2">
                  {t.due_on && (
                    <span className={overdue ? "text-red-700 font-medium" : dueToday ? "text-amber-700 font-medium" : ""}>
                      {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
                      {formatDue(t.due_on)}
                    </span>
                  )}
                  <Link href={`/admin/notes/${t.note.id}`} className="underline truncate max-w-full">
                    {t.note.title || "Untitled note"}
                  </Link>
                  {t.note.status === "inbox" && <span className="text-amber-700">unchecked</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
