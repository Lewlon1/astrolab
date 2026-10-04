"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FunnelCounts, Lead, ScoredLead } from "@/types";
import type { LeadStage } from "@/lib/leadStages";
import type { LeadAttribution } from "@/lib/leadAttribution";
import Toast from "@/components/admin/ui/Toast";
import DailyActionsPanel from "./DailyActionsPanel";
import QueuePanel from "./QueuePanel";
import AllLeadsPanel from "./AllLeadsPanel";
import LeadFunnelCard from "./LeadFunnelCard";
import LeadDrawer from "./LeadDrawer";

/**
 * The one place leads live in the admin.
 *
 * Replaces three overlapping surfaces: /admin/leads (flat table),
 * the old lead queue route (actions + ranked queue; it now redirects here) and the lead half of
 * /admin/analytics (funnel + recent signups).
 *
 * Tab and selected lead are URL state, so a tab is shareable, the back button
 * works, and lib/actionEngine.ts can deep-link straight to a lead. The drawer
 * is owned here rather than by QueuePanel so `?lead=` resolves from ANY tab —
 * a Daily Action links to a lead the Actions tab has no scored copy of.
 */

const TABS = [
  { id: "actions", label: "Daily actions" },
  { id: "queue", label: "Queue" },
  { id: "all", label: "All leads" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is Tab {
  return TABS.some((t) => t.id === value);
}

export interface ToastState {
  message: string;
  type: "success" | "error";
}

interface Props {
  leads: Lead[];
  attribution: Record<string, LeadAttribution>;
  funnel: FunnelCounts;
  stageCounts: Record<LeadStage, number>;
  analyticsAvailable: boolean;
}

export default function LeadsSectionClient({
  leads,
  attribution,
  funnel,
  stageCounts,
  analyticsAvailable,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: Tab = isTab(tabParam) ? tabParam : "actions";
  const leadParam = searchParams.get("lead");

  const [toast, setToast] = useState<ToastState | null>(null);
  const [detail, setDetail] = useState<{
    scored: ScoredLead;
    attribution: LeadAttribution | null;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const notify = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const openLead = useCallback(
    (leadId: string) => setParams({ lead: leadId }),
    [setParams]
  );
  const closeLead = useCallback(() => setParams({ lead: null }), [setParams]);

  /**
   * Resolve `?lead=` to a scored lead with its timeline and attribution.
   *
   * Always a fetch, even from the Queue tab which already holds a ScoredLead:
   * one code path means the drawer shows identical data wherever it opens, and
   * the queue's copy carries no attribution.
   */
  useEffect(() => {
    if (!leadParam) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    (async () => {
      try {
        const res = await fetch(`/api/admin/leads/${leadParam}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Could not load that lead");
        if (cancelled) return;
        setDetail({ scored: json.scored, attribution: json.attribution ?? null });
      } catch (err) {
        if (cancelled) return;
        notify(
          err instanceof Error ? err.message : "Could not load that lead",
          "error"
        );
        // A stale or deleted id should not leave the URL pointing at nothing.
        setParams({ lead: null });
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [leadParam, notify, setParams]);

  const refreshDetail = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 border-b border-[#e8e5df]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ tab: t.id })}
            aria-current={tab === t.id ? "page" : undefined}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-deep text-[#1a1a18]"
                : "border-transparent text-[#6b6560] hover:text-[#1a1a18]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "actions" && <DailyActionsPanel notify={notify} />}

      {tab === "queue" && (
        <QueuePanel notify={notify} onOpenLead={openLead} />
      )}

      {tab === "all" && (
        <div className="space-y-6">
          <LeadFunnelCard
            funnel={funnel}
            stageCounts={stageCounts}
            analyticsAvailable={analyticsAvailable}
          />
          <AllLeadsPanel
            leads={leads}
            attribution={attribution}
            notify={notify}
            onOpenLead={openLead}
          />
        </div>
      )}

      {loadingDetail && !detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10"
          role="status"
          aria-live="polite"
        >
          <span className="bg-white border border-[#e8e5df] rounded-lg px-4 py-2 text-sm text-[#6b6560]">
            Loading lead…
          </span>
        </div>
      )}

      {detail && (
        <LeadDrawer
          scored={detail.scored}
          attribution={detail.attribution}
          onClose={closeLead}
          notify={notify}
          onChanged={refreshDetail}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
