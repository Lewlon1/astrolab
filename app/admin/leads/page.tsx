import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import LeadsSectionClient from "@/components/admin/leads/LeadsSectionClient";
import { loadAttribution, type LeadAttribution } from "@/lib/leadAttribution";
import { STAGE_ORDER, normalizeStage, type LeadStage } from "@/lib/leadStages";
import type { FunnelCounts, Lead } from "@/types";

export const dynamic = "force-dynamic";

const EMPTY_FUNNEL: FunnelCounts = {
  visit: 0,
  engaged: 0,
  cta_click: 0,
  lead: 0,
  booking: 0,
};

/**
 * The consolidated Leads section.
 *
 * Fetches server-side only what the server does better: the analytics_funnel
 * RPC (SECURITY DEFINER, authenticated-only — it cannot be called from the
 * browser), the full lead list, and the session-key join for attribution.
 * Everything interactive lives in LeadsSectionClient.
 */
export default async function LeadsPage() {
  const supabase = await createClient();

  const [leadsRes, funnelRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Lead[]>(),
    // A 30-day window keeps the traffic funnel comparable to what the Analytics
    // page shows by default. The lead funnel beside it is all-time by design —
    // it answers "where is everyone", not "what happened this month".
    supabase.rpc("analytics_funnel", {
      p_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_to: new Date().toISOString(),
    }),
  ]);

  const leads = leadsRes.data ?? [];

  const stageCounts = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, 0])
  ) as Record<LeadStage, number>;
  for (const lead of leads) {
    stageCounts[normalizeStage(lead.status)] += 1;
  }

  const attributionMap = await loadAttribution(supabase, leads);
  const attribution: Record<string, LeadAttribution> =
    Object.fromEntries(attributionMap);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Leads"
        description={`${leads.length} total lead${leads.length !== 1 ? "s" : ""} · daily actions, ranked queue and the full list`}
      />
      {/* useSearchParams needs a Suspense boundary above it. */}
      <Suspense
        fallback={<p className="text-sm text-[#b8b0a4]">Loading leads…</p>}
      >
        <LeadsSectionClient
          leads={leads}
          attribution={attribution}
          funnel={(funnelRes.data as FunnelCounts | null) ?? EMPTY_FUNNEL}
          stageCounts={stageCounts}
          analyticsAvailable={!funnelRes.error}
        />
      </Suspense>
    </div>
  );
}
