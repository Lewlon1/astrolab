"use client";

import { useState } from "react";
import type { ScoredLead } from "@/types";
import { timeAgo } from "@/lib/utils";

const STAGES = [
  "new",
  "voice_note_sent",
  "nurturing",
  "booked",
  "converted",
] as const;

interface Props {
  scored: ScoredLead;
  onClose: () => void;
  notify: (message: string, type: "success" | "error") => void;
  onChanged: () => void;
}

export default function LeadDrawer({ scored, onClose, notify, onChanged }: Props) {
  const { lead } = scored;
  const [status, setStatus] = useState<string>(lead.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function markActioned() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lead-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, status, note: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      notify("Marked actioned", "success");
      onChanged();
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  const events = [...scored.events].sort((a, b) =>
    (b.occurred_at ?? "") > (a.occurred_at ?? "") ? 1 : -1
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-[#e8e5df] px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg text-[#1a1a18] truncate">
              {lead.name || lead.ig_handle || "Anonymous"}
            </h2>
            <p className="text-xs text-[#6b6560] truncate">{lead.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#b8b0a4] hover:text-[#1a1a18] transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Score breakdown */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-medium text-[#1a1a18]">
                {scored.score}
              </span>
              <span className="text-xs text-[#6b6560]">score</span>
            </div>
            <p className="text-sm text-[#6b6560] mb-3">{scored.reason}</p>

            <div className="space-y-1">
              {scored.factors.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[#6b6560]">{f.label}</span>
                  <span
                    className={
                      f.points >= 0 ? "text-emerald-700" : "text-red-700"
                    }
                  >
                    {f.points > 0 ? "+" : ""}
                    {f.points}
                  </span>
                </div>
              ))}
              {scored.factors.length === 0 && (
                <p className="text-xs text-[#b8b0a4]">No scoring signals yet.</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "Source", value: lead.source ?? "—" },
              { label: "Language", value: lead.language ?? "—" },
              { label: "IG handle", value: lead.ig_handle ?? "—" },
              { label: "Added", value: timeAgo(lead.created_at) },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[#b8b0a4]">{m.label}</p>
                <p className="text-[#1a1a18]">{m.value}</p>
              </div>
            ))}
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Event timeline */}
          <div>
            <h3 className="font-heading text-base text-[#1a1a18] mb-2">
              Timeline
            </h3>
            {events.length === 0 ? (
              <p className="text-xs text-[#b8b0a4]">No events recorded.</p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 40).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 py-1.5 border-b border-[#f0ede8] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#1a1a18]">
                        {ev.type.replace(/_/g, " ")}
                      </p>
                      {ev.source && (
                        <p className="text-[11px] text-[#b8b0a4]">{ev.source}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#b8b0a4] shrink-0">
                      {timeAgo(ev.occurred_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mark actioned */}
          <div className="border-t border-[#f0ede8] pt-5 space-y-3">
            <div>
              <label
                htmlFor="drawer-stage"
                className="block text-sm text-[#1a1a18] mb-1"
              >
                Stage
              </label>
              <select
                id="drawer-stage"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border border-[#e8e5df] rounded-lg px-3 py-2 bg-white text-[#1a1a18]"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drawer-note"
                className="block text-sm text-[#1a1a18] mb-1"
              >
                Note (optional)
              </label>
              <textarea
                id="drawer-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full text-sm border border-[#e8e5df] rounded-lg px-3 py-2 text-[#1a1a18] focus:outline-none focus:ring-1 focus:ring-deep"
              />
            </div>

            <button
              onClick={markActioned}
              disabled={saving}
              className="w-full text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Mark actioned"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
