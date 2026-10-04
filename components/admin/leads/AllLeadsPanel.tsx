"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/types";
import {
  timeAgo,
  leadStatusColors,
  leadSourceColors,
  formatSource,
} from "@/lib/utils";
import {
  SOURCES,
  STAGE_LABELS,
  STAGE_ORDER,
  TRACKS,
  TRACK_COLORS,
  TRACK_LABELS,
  formatStage,
  leadDisplayName,
  normalizeStage,
  normalizeTrack,
  stageRank,
} from "@/lib/leadStages";
import { cameFrom, type LeadAttribution } from "@/lib/leadAttribution";

/**
 * The full, unranked lead table.
 *
 * Two things changed when this moved out of /admin/leads and into the
 * consolidated section:
 *
 *  1. Writes go through PATCH /api/admin/leads/[id] instead of the browser
 *     Supabase client. Every stage change and note now leaves a lead_event, so
 *     the scoring engine's "recently actioned" penalty can actually see it.
 *     Previously a stage set here was invisible to the queue.
 *
 *  2. It absorbed the "Recent signups" table from the Analytics page — hence
 *     the Came from and Device columns, rather than a second table showing the
 *     same rows with different chrome.
 */

interface Props {
  leads: Lead[];
  attribution: Record<string, LeadAttribution>;
  notify: (message: string, type: "success" | "error") => void;
  onOpenLead: (leadId: string) => void;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function AllLeadsPanel({
  leads,
  attribution,
  notify,
  onOpenLead,
}: Props) {
  const router = useRouter();
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [pendingStageId, setPendingStageId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (stageFilter !== "all" && normalizeStage(lead.status) !== stageFilter) {
        return false;
      }
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (trackFilter !== "all" && normalizeTrack(lead.track) !== trackFilter) {
        return false;
      }
      if (q) {
        const haystack = [lead.name, lead.email, lead.ig_handle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [leads, stageFilter, sourceFilter, trackFilter, query]);

  function handleExpandNotes(lead: Lead) {
    if (expandedId === lead.id) {
      setExpandedId(null);
    } else {
      setExpandedId(lead.id);
      setNotesValue(lead.notes || "");
    }
  }

  async function patchLead(leadId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, via: "list" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Could not save");
  }

  async function handleStageChange(lead: Lead, nextStage: string) {
    setPendingStageId(null);
    if (nextStage === normalizeStage(lead.status)) return;

    try {
      await patchLead(lead.id, { stage: nextStage, actioned: true });
      notify(`Stage set to ${STAGE_LABELS[normalizeStage(nextStage)]}`, "success");
      router.refresh();
    } catch (err) {
      // The API rejects backwards moves with a 409 rather than letting the
      // database trigger clamp them silently — surface that message as-is.
      notify(err instanceof Error ? err.message : "Could not update stage", "error");
    }
  }

  async function handleSaveNotes(leadId: string) {
    setSavingNotes(true);
    try {
      await patchLead(leadId, { notes: notesValue });
      notify("Notes saved", "success");
      setExpandedId(null);
      router.refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not save notes", "error");
    } finally {
      setSavingNotes(false);
    }
  }

  function handleExportCSV() {
    const headers = [
      "Name",
      "Email",
      "IG handle",
      "Track",
      "Source",
      "Stage",
      "Came from",
      "Device",
      "Notes",
      "Created At",
    ];
    const rows = filtered.map((lead) => {
      const attr = attribution[lead.id];
      return [
        escapeCSV(lead.name || ""),
        escapeCSV(lead.email ?? ""),
        escapeCSV(lead.ig_handle ?? ""),
        escapeCSV(TRACK_LABELS[normalizeTrack(lead.track)]),
        escapeCSV(lead.source ? formatSource(lead.source) : ""),
        escapeCSV(formatStage(lead.status)),
        escapeCSV(cameFrom(lead)),
        escapeCSV(attr?.device ?? ""),
        escapeCSV(lead.notes || ""),
        escapeCSV(new Date(lead.created_at).toISOString()),
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-12 text-center">
        <p className="text-[#6b6560]">No leads yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or handle"
          aria-label="Search leads"
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20 min-w-[16rem]"
        />

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          aria-label="Filter by stage"
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <option value="all">All stages</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          aria-label="Filter by track"
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <option value="all">All tracks</option>
          {TRACKS.map((t) => (
            <option key={t} value={t}>
              {TRACK_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <option value="all">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {formatSource(s)}
            </option>
          ))}
        </select>

        <button
          onClick={handleExportCSV}
          className="ml-auto bg-white border border-[#e8e5df] text-[#1a1a18] px-4 py-2 rounded-lg hover:bg-[#f5f3ef] text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      <p className="text-sm text-[#6b6560]">
        Showing {filtered.length} of {leads.length} leads
      </p>

      {/* Table */}
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e5df] text-left text-[#6b6560]">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Came from</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const stage = normalizeStage(lead.status);
                const track = normalizeTrack(lead.track);
                const attr = attribution[lead.id];

                return (
                  <Fragment key={lead.id}>
                    <tr className="border-b border-[#e8e5df] last:border-0 hover:bg-[#fafaf8] transition-colors">
                      <td className="px-4 py-3 min-w-0">
                        <button
                          onClick={() => onOpenLead(lead.id)}
                          className="text-left font-medium text-[#1a1a18] hover:underline"
                        >
                          {leadDisplayName(lead)}
                        </button>
                        <p className="text-xs text-[#6b6560] truncate">
                          {lead.email ?? "no email on file"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TRACK_COLORS[track].bg} ${TRACK_COLORS[track].text}`}
                        >
                          {TRACK_LABELS[track]}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {lead.source ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${leadSourceColors[lead.source]?.bg ?? ""} ${leadSourceColors[lead.source]?.text ?? ""}`}
                          >
                            {formatSource(lead.source)}
                          </span>
                        ) : (
                          <span className="text-[#b8b0a4]">--</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#6b6560]">{cameFrom(lead)}</td>

                      <td className="px-4 py-3 text-[#6b6560]">
                        {attr?.device ?? <span className="text-[#b8b0a4]">--</span>}
                      </td>

                      <td className="px-4 py-3">
                        {pendingStageId === lead.id ? (
                          <select
                            autoFocus
                            value={stage}
                            onChange={(e) => handleStageChange(lead, e.target.value)}
                            onBlur={() => setPendingStageId(null)}
                            className="px-2 py-1 border border-[#e8e5df] rounded text-xs bg-white focus:outline-none"
                          >
                            {STAGE_ORDER.map((s) => (
                              <option
                                key={s}
                                value={s}
                                // Mirrors trg_leads_no_stage_regression: never
                                // offer a move the database will refuse. Use the
                                // drawer's override to correct a mis-set stage.
                                disabled={stageRank(s) < stageRank(stage)}
                              >
                                {STAGE_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setPendingStageId(lead.id)}
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${leadStatusColors[stage]?.bg ?? ""} ${leadStatusColors[stage]?.text ?? ""}`}
                          >
                            {STAGE_LABELS[stage]}
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#6b6560]">
                        {timeAgo(lead.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleExpandNotes(lead)}
                          className="text-sm text-deep hover:underline"
                        >
                          {expandedId === lead.id ? "Close" : "Notes"}
                        </button>
                      </td>
                    </tr>

                    {expandedId === lead.id && (
                      <tr className="border-b border-[#e8e5df] last:border-0 bg-[#fafaf8]">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="flex gap-3 items-start max-w-2xl">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Add notes about this lead..."
                              aria-label={`Notes for ${leadDisplayName(lead)}`}
                              rows={3}
                              className="flex-1 px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20 resize-y"
                            />
                            <button
                              onClick={() => handleSaveNotes(lead.id)}
                              disabled={savingNotes}
                              className="px-4 py-2 bg-deep text-white text-sm font-medium rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-50"
                            >
                              {savingNotes ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
