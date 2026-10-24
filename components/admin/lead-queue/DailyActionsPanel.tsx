"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActionItem, TankStatus } from "@/types";
import ActionCard from "./ActionCard";

interface BatchResponse {
  date: string;
  batch: number;
  items: ActionItem[];
  totalMinutes: number;
  tank: TankStatus;
  canRegenerate: boolean;
  exhausted?: boolean;
}

interface Props {
  notify: (message: string, type: "success" | "error") => void;
}

export default function DailyActionsPanel({ notify }: Props) {
  const [data, setData] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/actions");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load today's actions");
      setData(json);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not load actions", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

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

      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) => (i.id === id ? { ...i, status } : i)),
              canRegenerate: prev.items.every((i) =>
                i.id === id ? true : i.status !== "pending"
              ),
            }
          : prev
      );

      if (json.suppressedUntil) {
        notify(`Skipped again — suppressed until ${json.suppressedUntil}`, "success");
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/actions/regenerate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not regenerate");
      setData(json);
      if (json.exhausted) {
        notify("Nothing left worth doing today", "success");
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not regenerate", "error");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#b8b0a4]">Loading today&apos;s actions…</p>;
  }

  if (!data) return null;

  const pending = data.items.filter((i) => i.status === "pending");
  const resolved = data.items.filter((i) => i.status !== "pending");
  const skipped = data.items.filter((i) => i.status === "skipped");
  const allDone = data.items.length > 0 && pending.length === 0;

  return (
    <div className="space-y-6">
      {/* Honesty banner — mandatory on every batch */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b6560]">
                Batch {data.batch}
              </span>
              <span className="text-[11px] text-[#b8b0a4]">
                {data.items.length} action{data.items.length === 1 ? "" : "s"} ·{" "}
                {data.totalMinutes} min
              </span>
            </div>
            <p className="text-sm text-[#1a1a18] leading-relaxed">
              {data.tank.message}
            </p>
          </div>

          <button
            onClick={regenerate}
            disabled={!allDone || regenerating || data.exhausted}
            title={
              allDone
                ? "Pull the next ranked actions"
                : "Finish or skip everything above first"
            }
            className="shrink-0 text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {regenerating ? "Generating…" : "Generate 10 more"}
          </button>
        </div>

        {/* Tank meter */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#f0ede8] text-xs text-[#6b6560]">
          <span>
            <strong className="text-[#1a1a18]">{data.tank.tier1Remaining}</strong>{" "}
            conversion left
          </span>
          <span>
            <strong className="text-[#1a1a18]">{data.tank.tier2Remaining}</strong>{" "}
            ritual left
          </span>
          <span>
            <strong className="text-[#1a1a18]">{data.tank.tier3Remaining}</strong>{" "}
            engagement left
          </span>
          {data.tank.timeCapped && (
            <span className="text-amber-700">Time budget reached</span>
          )}
        </div>
      </div>

      {data.items.length === 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
          <p className="text-sm text-[#6b6560]">
            No actions today. That is a finished day, not a broken tool.
          </p>
        </div>
      )}

      {/* Pending cards */}
      <div className="space-y-3">
        {pending.map((item) => (
          <ActionCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onResolve={resolve}
          />
        ))}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
          <h3 className="font-heading text-base text-[#1a1a18] mb-3">
            Done &amp; skipped ({resolved.length})
          </h3>
          <div className="space-y-2">
            {resolved.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5 border-b border-[#f0ede8] last:border-0"
              >
                <span
                  className={`text-sm truncate ${
                    item.status === "done"
                      ? "text-[#b8b0a4] line-through"
                      : "text-[#6b6560]"
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-[11px] text-[#b8b0a4] shrink-0 ml-3">
                  {item.status === "done" ? "Done" : "Skipped"}
                </span>
              </div>
            ))}
          </div>

          {skipped.length > 0 && (
            <p className="text-xs text-[#b8b0a4] mt-3">
              Skipping the same action twice suppresses it for 7 days.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
