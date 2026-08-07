"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MergeReport, ScoredLead, ScoringWeight, SyncReport } from "@/types";
import { timeAgo } from "@/lib/utils";
import ScoringConfigPanel from "./ScoringConfigPanel";
import LeadDrawer from "./LeadDrawer";

const STAGES = [
  { value: "all", label: "All stages" },
  { value: "new", label: "New" },
  { value: "voice_note_sent", label: "Voice note sent" },
  { value: "nurturing", label: "Nurturing" },
  { value: "booked", label: "Booked" },
  { value: "converted", label: "Converted" },
];

const LANGUAGES = [
  { value: "all", label: "All languages" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

interface Props {
  notify: (message: string, type: "success" | "error") => void;
}

export default function QueuePanel({ notify }: Props) {
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [config, setConfig] = useState<ScoringWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState("all");
  const [language, setLanguage] = useState("all");
  const [selected, setSelected] = useState<ScoredLead | null>(null);
  const [merge, setMerge] = useState<MergeReport | null>(null);
  const [sync, setSync] = useState<SyncReport | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ stage, language });
      const res = await fetch(`/api/admin/lead-queue?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load the queue");
      setLeads(json.leads ?? []);
      setConfig(json.config ?? []);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not load the queue", "error");
    } finally {
      setLoading(false);
    }
  }, [stage, language, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function runSync() {
    setSyncing(true);
    setSync(null);
    try {
      const res = await fetch("/api/admin/lead-queue/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setSync(json.report);
      notify(
        `Synced ${json.report.subscribersSeen} subscribers — ${json.report.created} new, ${json.report.updated} updated`,
        "success"
      );
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function uploadCsv(file: File) {
    setUploading(true);
    setMerge(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/lead-queue/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setMerge(json.report);
      notify(
        `${json.report.created} created, ${json.report.mergedByEmail + json.report.mergedByHandle} merged`,
        "success"
      );
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runSync}
            disabled={syncing}
            className="text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors disabled:opacity-40"
          >
            {syncing ? "Syncing…" : "Sync MailerLite"}
          </button>

          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-[#1a1a18] border border-[#e8e5df] px-4 py-2.5 rounded-lg hover:bg-[#f5f3ef] transition-colors disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload ManyChat CSV"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCsv(f);
            }}
          />

          <div className="flex-1" />

          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="text-sm border border-[#e8e5df] rounded-lg px-3 py-2.5 bg-white text-[#1a1a18]"
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border border-[#e8e5df] rounded-lg px-3 py-2.5 bg-white text-[#1a1a18]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {sync && sync.errors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#f0ede8]">
            <p className="text-xs font-medium text-red-700 mb-1">
              Sync finished with {sync.errors.length} problem
              {sync.errors.length === 1 ? "" : "s"}
            </p>
            <ul className="text-xs text-[#6b6560] space-y-0.5 max-h-32 overflow-y-auto">
              {sync.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Merge report — visible, never silent */}
      {merge && <MergeReportCard report={merge} />}

      {/* Queue table */}
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e5df] flex items-center justify-between">
          <h2 className="font-heading text-lg text-[#1a1a18]">
            Ranked queue
          </h2>
          <span className="text-xs text-[#b8b0a4]">
            {leads.length} lead{leads.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-[#b8b0a4]">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[#b8b0a4]">
            No leads match these filters. Run a sync or upload a CSV to populate the queue.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#6b6560] border-b border-[#f0ede8]">
                  <th className="px-6 py-2.5 font-medium w-16">Score</th>
                  <th className="px-3 py-2.5 font-medium">Lead</th>
                  <th className="px-3 py-2.5 font-medium">Why now</th>
                  <th className="px-3 py-2.5 font-medium w-32">Stage</th>
                  <th className="px-6 py-2.5 font-medium w-20 text-right">Added</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((scored) => (
                  <tr
                    key={scored.lead.id}
                    onClick={() => setSelected(scored)}
                    className="border-b border-[#f0ede8] last:border-0 hover:bg-[#f5f3ef] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="font-medium text-[#1a1a18]">
                        {scored.score}
                      </span>
                    </td>
                    <td className="px-3 py-3 min-w-0">
                      <p className="font-medium text-[#1a1a18] truncate">
                        {scored.lead.name || scored.lead.ig_handle || "Anonymous"}
                      </p>
                      <p className="text-xs text-[#6b6560] truncate">
                        {scored.lead.email}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[#6b6560] max-w-md">
                      <span className="line-clamp-2">{scored.reason}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {scored.lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-[11px] text-[#b8b0a4]">
                      {timeAgo(scored.lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ScoringConfigPanel
        config={config}
        notify={notify}
        onSaved={load}
      />

      {selected && (
        <LeadDrawer
          scored={selected}
          onClose={() => setSelected(null)}
          notify={notify}
          onChanged={load}
        />
      )}
    </div>
  );
}

function MergeReportCard({ report }: { report: MergeReport }) {
  const merged = report.mergedByEmail + report.mergedByHandle;

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <h3 className="font-heading text-base text-[#1a1a18] mb-3">Merge report</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Rows read", value: report.totalRows },
          { label: "Created", value: report.created },
          { label: "Merged", value: merged },
          { label: "Skipped", value: report.skipped.length },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-xs text-[#6b6560]">{s.label}</p>
            <p className="text-lg font-medium text-[#1a1a18]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="text-xs text-[#6b6560] space-y-2">
        <p>
          Merged by email: {report.mergedByEmail} · by IG handle:{" "}
          {report.mergedByHandle}
        </p>

        <div>
          <p className="font-medium text-[#1a1a18] mb-1">Columns used</p>
          <p>
            {Object.entries(report.mappedColumns)
              .map(([header, field]) => `${header} → ${field}`)
              .join(", ") || "none"}
          </p>
        </div>

        {report.unmappedColumns.length > 0 && (
          <div>
            <p className="font-medium text-amber-700 mb-1">
              Columns ignored ({report.unmappedColumns.length})
            </p>
            <p>{report.unmappedColumns.join(", ")}</p>
            <p className="mt-1 text-[#b8b0a4]">
              Nothing was merged from these. Add them to FIELD_ALIASES in the
              upload route if they matter.
            </p>
          </div>
        )}

        {report.skipped.length > 0 && (
          <div>
            <p className="font-medium text-[#1a1a18] mb-1">Skipped rows</p>
            <ul className="space-y-0.5 max-h-40 overflow-y-auto">
              {report.skipped.slice(0, 50).map((s) => (
                <li key={s.row}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
