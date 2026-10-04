"use client";

import { useEffect, useState } from "react";
import type { ScoredLead } from "@/types";
import { timeAgo } from "@/lib/utils";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  TRACK_COLORS,
  TRACK_LABELS,
  formatSource,
  leadDisplayName,
  normalizeStage,
  normalizeTrack,
  stageRank,
} from "@/lib/leadStages";
import { cameFrom, type LeadAttribution } from "@/lib/leadAttribution";

interface Props {
  scored: ScoredLead;
  attribution?: LeadAttribution | null;
  onClose: () => void;
  notify: (message: string, type: "success" | "error") => void;
  onChanged: () => void;
}

/** "14:32" or "Unknown" or "Not asked" — the three states birth_time can hold. */
function birthTimeLabel(
  time: string | null | undefined,
  known: boolean | null | undefined
): string {
  if (time) return time.slice(0, 5);
  if (known === false) return "Unknown";
  return "Not asked";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#b8b0a4]">{label}</p>
      <p className="text-[#1a1a18] break-words">{value}</p>
    </div>
  );
}

export default function LeadDrawer({
  scored,
  attribution,
  onClose,
  notify,
  onChanged,
}: Props) {
  const { lead } = scored;
  const currentStage = normalizeStage(lead.status);
  const track = normalizeTrack(lead.track);

  const [stage, setStage] = useState<string>(currentStage);
  const [override, setOverride] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Escape closes, matching the disclosure behaviour established in AdminNav.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function markActioned() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          note: note || undefined,
          actioned: true,
          override: override || undefined,
          via: "drawer",
        }),
      });
      const json = await res.json().catch(() => ({}));
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

  const hasBirthData =
    lead.birth_date || lead.birth_place || lead.birth_time || lead.opening_question;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Lead: ${leadDisplayName(lead)}`}
        className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
      >
        <div className="sticky top-0 bg-white border-b border-[#e8e5df] px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg text-[#1a1a18] truncate">
              {leadDisplayName(lead)}
            </h2>
            <p className="text-xs text-[#6b6560] truncate">
              {lead.email ?? "no email on file"}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${TRACK_COLORS[track].bg} ${TRACK_COLORS[track].text}`}
              >
                {TRACK_LABELS[track]}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {STAGE_LABELS[currentStage]}
              </span>
            </div>
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
                <div key={f.key} className="flex items-center justify-between text-xs">
                  <span className="text-[#6b6560]">{f.label}</span>
                  <span className={f.points >= 0 ? "text-emerald-700" : "text-red-700"}>
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

          {/* Birth data — the cold gate's qualification filter */}
          {hasBirthData && (
            <div>
              <h3 className="font-heading text-base text-[#1a1a18] mb-2">
                Birth data
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Date" value={lead.birth_date ?? "—"} />
                <Field
                  label="Time"
                  value={birthTimeLabel(lead.birth_time, lead.birth_time_known)}
                />
                <Field label="Place" value={lead.birth_place ?? "—"} />
                <Field label="Language" value={lead.language ?? "—"} />
              </div>
              {lead.opening_question && (
                <div className="mt-3 text-xs">
                  <p className="text-[#b8b0a4]">Their question</p>
                  <p className="text-[#1a1a18] italic">
                    &ldquo;{lead.opening_question}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Referral — warm track only */}
          {track === "warm" && (lead.referred_by || lead.whatsapp) && (
            <div>
              <h3 className="font-heading text-base text-[#1a1a18] mb-2">
                Referral
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Sent by" value={lead.referred_by ?? "—"} />
                <Field label="WhatsApp" value={lead.whatsapp ?? "—"} />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field
              label="Source"
              value={lead.source ? formatSource(lead.source) : "—"}
            />
            <Field label="IG handle" value={lead.ig_handle ?? "—"} />
            <Field label="Added" value={timeAgo(lead.created_at)} />
            <Field
              label="Consent"
              value={
                lead.consent_at
                  ? `${new Date(lead.consent_at).toLocaleDateString("en-GB")}${lead.consent_version ? ` · ${lead.consent_version}` : ""}`
                  : "—"
              }
            />
          </div>

          {/* Attribution */}
          <div>
            <h3 className="font-heading text-base text-[#1a1a18] mb-2">
              Attribution
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="Came from" value={cameFrom(lead)} />
              <Field label="Landing page" value={lead.landing_path ?? "—"} />
              <Field label="Device" value={attribution?.device ?? "—"} />
              <Field label="Country" value={attribution?.country ?? "—"} />
            </div>
            {attribution?.sectionsSeen && attribution.sectionsSeen.length > 0 && (
              <div className="mt-3 text-xs">
                <p className="text-[#b8b0a4] mb-1">
                  Sections read before converting
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {attribution.sectionsSeen.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
            <h3 className="font-heading text-base text-[#1a1a18] mb-2">Timeline</h3>
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
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-sm border border-[#e8e5df] rounded-lg px-3 py-2 bg-white text-[#1a1a18]"
              >
                {STAGE_ORDER.map((s) => (
                  <option
                    key={s}
                    value={s}
                    // Mirrors trg_leads_no_stage_regression. Without the
                    // override the database clamps a backwards move silently,
                    // so offering it would be a dropdown that appears broken.
                    disabled={!override && stageRank(s) < stageRank(currentStage)}
                  >
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>

              <label className="mt-2 flex items-center gap-2 text-xs text-[#6b6560]">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => {
                    setOverride(e.target.checked);
                    if (!e.target.checked) setStage(currentStage);
                  }}
                  className="rounded border-[#e8e5df]"
                />
                Correct a mis-set stage (allows moving backwards)
              </label>
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
