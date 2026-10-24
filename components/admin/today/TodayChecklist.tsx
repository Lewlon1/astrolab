"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActionItem } from "@/types";
import ActionCard from "@/components/admin/lead-queue/ActionCard";
import Toast from "@/components/admin/ui/Toast";
import { splitToday } from "@/lib/admin/today";

/**
 * Today's Daily Actions batch as a checklist, grouped for the home screen.
 * `initialItems` is null when the batch could not be loaded.
 */
export default function TodayChecklist({ initialItems }: { initialItems: ActionItem[] | null }) {
  const [items, setItems] = useState(initialItems ?? []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (initialItems === null) {
    return (
      <section className="bg-white border border-[#e8e5df] rounded-xl p-5">
        <p className="text-sm text-[#6b6560]">
          Couldn&apos;t load today&apos;s actions.{" "}
          <Link href="/admin/lead-queue" className="text-deep underline">
            Open Lead Queue
          </Link>
        </p>
      </section>
    );
  }

  async function resolve(id: string, status: "done" | "skipped") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const { clients, engage, other, done, total } = splitToday(items);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const list = (section: ActionItem[]) => (
    <div className="space-y-3">
      {section.map((item) => (
        <ActionCard key={item.id} item={item} busy={busyId === item.id} onResolve={resolve} />
      ))}
    </div>
  );

  return (
    <section className="space-y-6">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* Progress — the finish line */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg text-[#1a1a18]">
            {allDone ? "Today is done" : "Today's actions"}
          </h2>
          <span className="text-sm text-[#6b6560] shrink-0">
            {done} of {total} done
          </span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-[#f0ede8] overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {total === 0 && (
          <p className="text-sm text-[#6b6560] mt-3">No actions today. That is a finished day, not a broken tool.</p>
        )}
        {allDone && (
          <p className="text-sm text-[#6b6560] mt-3">
            Want more?{" "}
            <Link href="/admin/lead-queue" className="text-deep underline">
              Generate the next batch in Lead Queue
            </Link>
          </p>
        )}
      </div>

      {clients.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#6b6560]">
            Follow up · closest to booking
          </h3>
          {list(clients)}
        </div>
      )}

      {engage.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#6b6560]">
              Engage · ~{engage.reduce((m, i) => m + i.est_minutes, 0)} min
            </h3>
            <Link href="/admin/engagement" className="text-xs text-deep underline shrink-0">
              Reply assistant
            </Link>
          </div>
          {list(engage)}
        </div>
      )}

      {other.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#6b6560]">Also today</h3>
          {list(other)}
        </div>
      )}
    </section>
  );
}
