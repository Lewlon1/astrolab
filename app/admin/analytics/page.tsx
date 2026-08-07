import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AnalyticsDashboardClient, {
  type DashboardSignup,
} from "@/components/admin/AnalyticsDashboardClient";
import type {
  OverviewKpis,
  SectionDwellRow,
  TopClickRow,
  FunnelCounts,
  Lead,
} from "@/types";

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
const EMPTY_FUNNEL: FunnelCounts = {
  visit: 0,
  engaged: 0,
  cta_click: 0,
  lead: 0,
  booking: 0,
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

  const [overviewRes, dwellRes, clicksRes, funnelRes, leadsRes] =
    await Promise.all([
      supabase.rpc("analytics_overview", { p_from, p_to }),
      supabase.rpc("analytics_section_dwell", { p_from, p_to }),
      supabase.rpc("analytics_top_clicks", { p_from, p_to }),
      supabase.rpc("analytics_funnel", { p_from, p_to }),
      supabase
        .from("leads")
        .select("*")
        .gte("created_at", p_from)
        .lte("created_at", p_to)
        .order("created_at", { ascending: false })
        .returns<Lead[]>(),
    ]);

  // If the RPCs aren't there yet (migrations not applied), degrade gracefully.
  const available = !overviewRes.error;

  const overview: OverviewKpis =
    (overviewRes.data as OverviewKpis | null) ?? EMPTY_OVERVIEW;
  const sectionDwell: SectionDwellRow[] =
    (dwellRes.data as SectionDwellRow[] | null) ?? [];
  const topClicks: TopClickRow[] = (clicksRes.data as TopClickRow[] | null) ?? [];
  const funnel: FunnelCounts =
    (funnelRes.data as FunnelCounts | null) ?? EMPTY_FUNNEL;
  const leads = leadsRes.data ?? [];

  // Enrich converting sessions with device/country + sections read.
  const sessionKeys = Array.from(
    new Set(leads.map((l) => l.session_key).filter((k): k is string => !!k))
  );
  const sectionsBySession: Record<string, string[]> = {};
  const metaBySession: Record<string, { device: string | null; country: string | null }> = {};

  if (sessionKeys.length > 0) {
    const [viewsRes, sessRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("session_key, section")
        .eq("event_type", "section_view")
        .in("session_key", sessionKeys),
      supabase
        .from("analytics_sessions")
        .select("session_key, device, country")
        .in("session_key", sessionKeys),
    ]);

    for (const v of (viewsRes.data ?? []) as { session_key: string; section: string | null }[]) {
      if (!v.section) continue;
      (sectionsBySession[v.session_key] ||= []).push(v.section);
    }
    for (const s of (sessRes.data ?? []) as {
      session_key: string;
      device: string | null;
      country: string | null;
    }[]) {
      metaBySession[s.session_key] = { device: s.device, country: s.country };
    }
  }

  // Source / status breakdowns.
  const bySource: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const l of leads) {
    const src = l.source ?? "unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
  }

  const signups: DashboardSignup[] = leads.slice(0, 25).map((l) => {
    const meta = l.session_key ? metaBySession[l.session_key] : undefined;
    const sections = l.session_key ? sectionsBySession[l.session_key] ?? [] : [];
    return {
      id: l.id,
      email: l.email,
      source: l.source,
      status: l.status,
      created_at: l.created_at,
      referrer: l.referrer ?? null,
      utm_source: l.utm_source ?? null,
      device: meta?.device ?? null,
      country: meta?.country ?? null,
      sections_seen: Array.from(new Set(sections)),
    };
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Landing-page engagement, reading time, and conversions"
      />
      <AnalyticsDashboardClient
        rangeKey={rangeKey}
        available={available}
        overview={overview}
        sectionDwell={sectionDwell}
        topClicks={topClicks}
        funnel={funnel}
        totalLeads={leads.length}
        bySource={bySource}
        byStatus={byStatus}
        signups={signups}
        sectionLabels={SECTION_LABELS}
      />
    </div>
  );
}
