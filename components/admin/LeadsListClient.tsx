"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lead } from "@/types";
import Toast from "@/components/admin/ui/Toast";
import {
  timeAgo,
  leadStatusColors,
  leadSourceColors,
  formatStatus,
  formatSource,
} from "@/lib/utils";

const STATUS_OPTIONS: Lead["status"][] = [
  "new",
  "voice_note_sent",
  "nurturing",
  "booked",
  "converted",
];

const SOURCE_OPTIONS: NonNullable<Lead["source"]>[] = [
  "website_form",
  "lovecode",
  "event_qr",
  "manychat",
];

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function LeadsListClient({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const filteredLeads = localLeads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
    return true;
  });

  function handleExpandNotes(lead: Lead) {
    if (expandedId === lead.id) {
      setExpandedId(null);
    } else {
      setExpandedId(lead.id);
      setNotesValue(lead.notes || "");
    }
  }

  async function handleStatusChange(leadId: string, newStatus: Lead["status"]) {
    setEditingStatusId(null);

    // Optimistic update
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      // Revert on error
      setLocalLeads(leads);
      setToast({ message: "Failed to update status", type: "error" });
    } else {
      setToast({ message: "Status updated", type: "success" });
      router.refresh();
    }
  }

  async function handleSaveNotes(leadId: string) {
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({ notes: notesValue })
      .eq("id", leadId);

    setSavingNotes(false);

    if (error) {
      setToast({ message: "Failed to save notes", type: "error" });
    } else {
      setLocalLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, notes: notesValue } : l))
      );
      setToast({ message: "Notes saved", type: "success" });
      router.refresh();
    }
  }

  function handleExportCSV() {
    const headers = ["Name", "Email", "Source", "Status", "Notes", "Created At"];
    const rows = filteredLeads.map((lead) => [
      escapeCSV(lead.name || "Anonymous"),
      escapeCSV(lead.email),
      escapeCSV(lead.source ? formatSource(lead.source) : ""),
      escapeCSV(formatStatus(lead.status)),
      escapeCSV(lead.notes || ""),
      escapeCSV(new Date(lead.created_at).toISOString()),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (localLeads.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-12 text-center">
        <p className="text-[#6b6560]">No leads yet.</p>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {formatStatus(s)}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-[#e8e5df] rounded-lg text-sm text-[#1a1a18] bg-white focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <option value="all">All sources</option>
          {SOURCE_OPTIONS.map((s) => (
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

      {/* Results count */}
      <p className="text-sm text-[#6b6560]">
        Showing {filteredLeads.length} of {localLeads.length} leads
      </p>

      {/* Table */}
      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e5df] text-left text-[#6b6560]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <Fragment key={lead.id}>
                <tr
                  className="border-b border-[#e8e5df] last:border-0 hover:bg-[#fafaf8] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1a1a18]">
                    {lead.name || "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-[#6b6560]">{lead.email}</td>
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
                  <td className="px-4 py-3">
                    {editingStatusId === lead.id ? (
                      <select
                        autoFocus
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(
                            lead.id,
                            e.target.value as Lead["status"]
                          )
                        }
                        onBlur={() => setEditingStatusId(null)}
                        className="px-2 py-1 border border-[#e8e5df] rounded text-xs bg-white focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {formatStatus(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(lead.id)}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${leadStatusColors[lead.status]?.bg ?? ""} ${leadStatusColors[lead.status]?.text ?? ""}`}
                      >
                        {formatStatus(lead.status)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6b6560]">
                    {timeAgo(lead.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleExpandNotes(lead)}
                      className="text-sm text-deep hover:underline"
                    >
                      {expandedId === lead.id ? "Close" : "Notes"}
                    </button>
                  </td>
                </tr>

                {expandedId === lead.id && (
                  <tr
                    className="border-b border-[#e8e5df] last:border-0 bg-[#fafaf8]"
                  >
                    <td colSpan={6} className="px-4 py-4">
                      <div className="flex gap-3 items-start max-w-2xl">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes about this lead..."
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
