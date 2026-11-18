"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TodoWithNote } from "@/lib/notes/status";
import { formatDue } from "@/components/admin/notes/InboxCard";

interface Props {
  data: { todos: TodoWithNote[]; inbox: number; today: string } | null;
}

/** Today's "From your notes" card: due/overdue to-dos (tick inline) + inbox count. Hidden when empty. */
export default function NotesCard({ data }: Props) {
  const router = useRouter();
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) return null;
  const todos = data.todos.filter((t) => !ticked.has(t.id));
  if (todos.length === 0 && data.inbox === 0) return null;

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

  return (
    <section className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-3">
      <h2 className="font-heading text-lg text-[#1a1a18]">From your notes</h2>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {todos.length > 0 && (
        <ul className="divide-y divide-[#f0ede8]">
          {todos.map((t) => {
            const overdue = t.due_on !== null && t.due_on < data.today;
            return (
              <li key={t.id} className="flex items-start gap-3 py-2.5">
                <button
                  type="button"
                  onClick={() => tick(t.id)}
                  disabled={busy !== null}
                  aria-label="Mark done"
                  className="shrink-0 mt-0.5 w-6 h-6 rounded-md border border-[#d6d1c8] bg-white hover:border-emerald-500 disabled:opacity-60"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/notes/${t.note.id}`} className="text-sm text-[#1a1a18] hover:underline">
                    {t.text}
                  </Link>
                  <p className="text-xs text-[#6b6560] mt-0.5">
                    {overdue ? (
                      <span className="text-red-700 font-medium">overdue · {formatDue(t.due_on as string)}</span>
                    ) : (
                      <span className="text-amber-700 font-medium">today</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {data.inbox > 0 && (
        <Link href="/admin/notes" className="block text-sm text-[#1a1a18] underline">
          {data.inbox} {data.inbox === 1 ? "note" : "notes"} in your inbox
        </Link>
      )}
    </section>
  );
}
