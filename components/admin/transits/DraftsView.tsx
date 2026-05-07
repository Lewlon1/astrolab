"use client";

import { useState } from "react";
import type {
  TransitDraftRow,
  TransitHoroscopeRow,
  HoroscopeRead,
  Sign,
} from "@/lib/transits/types";
import { SIGNS } from "@/lib/transits/types";
import { formatShortDate } from "@/lib/transits/utils";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";

interface DraftsViewProps {
  drafts: TransitDraftRow[];
  bundles: TransitHoroscopeRow[];
  loading: boolean;
  onDeleteDraft: (id: string) => Promise<void>;
  onDeleteBundle: (id: string) => Promise<void>;
}

type DeleteTarget =
  | { kind: "draft"; id: string; label: string }
  | { kind: "bundle"; id: string; label: string }
  | null;

export default function DraftsView({
  drafts,
  bundles,
  loading,
  onDeleteDraft,
  onDeleteBundle,
}: DraftsViewProps) {
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState<DeleteTarget>(null);

  const handleConfirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.kind === "draft") {
        await onDeleteDraft(confirm.id);
      } else {
        await onDeleteBundle(confirm.id);
      }
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center space-y-3">
        <div className="inline-block w-6 h-6 border-2 border-deep/20 border-t-deep rounded-full animate-spin" />
        <p className="text-sm text-[#6b6560]">Loading saved content...</p>
      </div>
    );
  }

  if (drafts.length === 0 && bundles.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
        <p className="text-[#6b6560]">
          Nothing saved yet. Pick a transit and draft your first piece.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Single-post drafts */}
      <section>
        <h2 className="font-heading text-lg text-[#1a1a18] mb-3">
          Single-post drafts
          <span className="ml-2 text-xs text-[#b8b0a4] font-normal">
            ({drafts.length})
          </span>
        </h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-[#6b6560]">No single-post drafts yet.</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => (
              <DraftCard
                key={d.id}
                draft={d}
                onDelete={() =>
                  setConfirm({
                    kind: "draft",
                    id: d.id,
                    label: d.transit_title,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Horoscope bundles */}
      <section id="bundles">
        <h2 className="font-heading text-lg text-[#1a1a18] mb-3">
          Horoscope bundles
          <span className="ml-2 text-xs text-[#b8b0a4] font-normal">
            ({bundles.length})
          </span>
        </h2>
        {bundles.length === 0 ? (
          <p className="text-sm text-[#6b6560]">No horoscope bundles yet.</p>
        ) : (
          <div className="space-y-3">
            {bundles.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                expanded={expandedBundleId === b.id}
                onToggle={() =>
                  setExpandedBundleId((cur) => (cur === b.id ? null : b.id))
                }
                onDelete={() =>
                  setConfirm({
                    kind: "bundle",
                    id: b.id,
                    label: b.transit_title,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={confirm?.kind === "bundle" ? "Delete bundle?" : "Delete draft?"}
        message={`This will permanently delete "${confirm?.label ?? ""}".`}
      />
    </div>
  );
}

function DraftCard({
  draft,
  onDelete,
}: {
  draft: TransitDraftRow;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-5">
      <div className="flex items-start gap-3 flex-wrap mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#1a1a18] capitalize">
              {draft.format}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 capitalize">
              {draft.pillar}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#6b6560] uppercase">
              {draft.language}
            </span>
          </div>
          <h3 className="font-heading text-base text-[#1a1a18]">
            {draft.transit_title}
          </h3>
          <p className="text-xs text-[#6b6560] mt-0.5">
            {formatShortDate(draft.transit_date)}
            {draft.angle ? ` · "${draft.angle}"` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <pre className="text-sm text-[#1a1a18] leading-relaxed whitespace-pre-wrap font-sans bg-[#fafaf8] border border-[#e8e5df] rounded-lg p-3">
        {draft.content}
      </pre>
    </div>
  );
}

function BundleCard({
  bundle,
  expanded,
  onToggle,
  onDelete,
}: {
  bundle: TransitHoroscopeRow;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const reads = Array.isArray(bundle.reads) ? (bundle.reads as HoroscopeRead[]) : [];
  const lookup = new Map<string, HoroscopeRead>();
  for (const r of reads) lookup.set(`${r.sign}-${r.placement}`, r);

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              24 reads
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f5f3ef] text-[#6b6560] uppercase">
              {bundle.language}
            </span>
          </div>
          <h3 className="font-heading text-base text-[#1a1a18]">
            {bundle.transit_title}
          </h3>
          <p className="text-xs text-[#6b6560] mt-0.5">
            {formatShortDate(bundle.transit_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors"
          >
            {expanded ? "Hide" : "Show all 24"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[#e8e5df] px-5 py-4 space-y-4 bg-[#fafaf8]">
          {(["sun", "rising"] as const).map((placement) => (
            <div key={placement}>
              <h4 className="text-xs font-medium text-[#6b6560] uppercase tracking-wider mb-2">
                {placement === "sun" ? "Sun signs" : "Rising signs"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SIGNS.map((sign: Sign) => {
                  const read = lookup.get(`${sign}-${placement}`);
                  if (!read) return null;
                  return <ReadCard key={`${sign}-${placement}`} read={read} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadCard({ read }: { read: HoroscopeRead }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${read.sign} ${read.placement === "sun" ? "Sun" : "Rising"}\n\n${read.content}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="border border-[#e8e5df] rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-sm font-medium text-[#1a1a18]">{read.sign}</div>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium text-deep hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-[#1a1a18] leading-relaxed whitespace-pre-line">
        {read.content}
      </p>
    </div>
  );
}
