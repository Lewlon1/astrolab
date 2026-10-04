import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AnalyticsDashboardClient from "@/components/admin/AnalyticsDashboardClient";
import type { OverviewKpis, SectionDwellRow, TopClickRow } from "@/types";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  jung: "Jung quote",
  founder: "Founder",
  tarot: "Services · Tarot",
  magazine: "Travel magazine",
  services_index: "Services · Catalog",
  testimonials: "Testimonials",
  lead_capture: "Newsletter",
  blog: "Blog",
  home_cta: "Final CTA",
};

const EMPTY_OVERVIEW: OverviewKpis = {
  sessions: 0,
  pageviews: 0,
  avg_duration_ms: 0,
  median_duration_ms: 0,
  bounce_rate: 0,
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const rangeKey =
    searchParams.range && RANGES[searchParams.range] ? searchParams.range : "7d";
  const to = new Date();
  const from = new Date(to.getTime() - RANGES[rangeKey]);
  const p_from = from.toISOString();
  const p_to = to.toISOString();

  const supabase = await createClient();

  const [overviewRes, dwellRes, clicksRes] = await Promise.all([
    supabase.rpc("analytics_overview", { p_from, p_to }),
    supabase.rpc("analytics_section_dwell", { p_from, p_to }),
    supabase.rpc("analytics_top_clicks", { p_from, p_to }),
  ]);

  // If the RPCs aren't there yet (migrations not applied), degrade gracefully.
  const available = !overviewRes.error;

  const overview: OverviewKpis =
    (overviewRes.data as OverviewKpis | null) ?? EMPTY_OVERVIEW;
  const sectionDwell: SectionDwellRow[] =
    (dwellRes.data as SectionDwellRow[] | null) ?? [];
  const topClicks: TopClickRow[] = (clicksRes.data as TopClickRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Landing-page engagement and reading time. Conversions live under Leads."
      />
      <AnalyticsDashboardClient
        rangeKey={rangeKey}
        available={available}
        overview={overview}
        sectionDwell={sectionDwell}
        topClicks={topClicks}
        sectionLabels={SECTION_LABELS}
      />
    </div>
  );
}
