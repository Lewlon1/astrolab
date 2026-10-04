"use client";

import Link from "next/link";
import { SECTION_ORDER } from "@/lib/analytics/constants";
import type { OverviewKpis, SectionDwellRow, TopClickRow } from "@/types";

/**
 * Traffic and behaviour only.
 *
 * The conversion funnel, the "who signs up" breakdown and the recent-signups
 * table all moved to /admin/leads. They were lead-shaped, and having them here
 * meant two pages answered "how many signed up" from two different sources —
 * this one counted sessions via the analytics_funnel RPC, the other counted
 * rows in `leads`. The funnel now sits beside the stage funnel on the Leads
 * page, with both units named.
 */
interface Props {
  rangeKey: string;
  available: boolean;
  overview: OverviewKpis;
  sectionDwell: SectionDwellRow[];
  topClicks: TopClickRow[];
  sectionLabels: Record<string, string>;
}

const RANGES: { key: string; label: string }[] = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

const CLICK_LABELS: Record<string, string> = {
  cta_draw_card: "Hero · Draw a Card",
  cta_meet_gabriela: "Hero · Meet Gabriela",
  cta_book_home: "Final CTA · Choose a reading",
  cta_book_card: "Service · Book Now",
  cta_book_page: "Book page · Book",
  cta_tarot_start_here: "Tarot · Start Here",
  cta_order_magazine: "Magazine · Order issue",
  cta_lead_magnet: "Service · Lead magnet",
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[#e8e5df] rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function Bar({ pct, color = "bg-deep" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-[#f0ede8] overflow-hidden">
      <div
        className={`h-full ${color} rounded-full`}
        style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
      />
    </div>
  );
}

export default function AnalyticsDashboardClient({
  rangeKey,
  available,
  overview,
  sectionDwell,
  topClicks,
  sectionLabels,
}: Props) {
  // --- KPI cards ---
  const kpis = [
    { label: "Sessions", value: num(overview.sessions).toLocaleString() },
    { label: "Page views", value: num(overview.pageviews).toLocaleString() },
    { label: "Avg. visit", value: formatDuration(num(overview.avg_duration_ms)) },
    { label: "Median visit", value: formatDuration(num(overview.median_duration_ms)) },
    { label: "Bounce rate", value: `${num(overview.bounce_rate)}%` },
  ];

  // --- Section dwell, in scroll order ---
  const dwellBySection = new Map(sectionDwell.map((r) => [r.section, r]));
  const sectionRows = SECTION_ORDER.map((s) => {
    const row = dwellBySection.get(s);
    return {
      section: s,
      label: sectionLabels[s] ?? s,
      avg: num(row?.avg_dwell_ms),
      views: num(row?.views),
    };
  });
  const maxDwell = Math.max(1, ...sectionRows.map((r) => r.avg));

  // --- Top clicks ---
  const maxClicks = Math.max(1, ...topClicks.map((c) => num(c.clicks)));

  return (
    <div className="space-y-8">
      {/* Date range filter */}
      <div className="flex items-center gap-2">
        {RANGES.map((r) => {
          const active = r.key === rangeKey;
          return (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                active
                  ? "bg-deep text-white border-deep"
                  : "bg-white text-[#6b6560] border-[#e8e5df] hover:bg-[#f5f3ef]"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      {!available && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          No analytics tables found yet. Apply migrations{" "}
          <code className="font-mono">009_analytics.sql</code> and{" "}
          <code className="font-mono">010_analytics_rpcs.sql</code> in the Supabase
          SQL Editor, then reload. Numbers will populate as visitors browse the site.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-[#e8e5df] rounded-xl p-5"
          >
            <p className="text-sm text-[#6b6560]">{k.label}</p>
            <p className="text-2xl font-medium mt-1 text-[#1a1a18]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Section reading time — the headline */}
        <Card>
          <h2 className="font-heading text-lg text-[#1a1a18] mb-1">
            Time reading each section
          </h2>
          <p className="text-xs text-[#b8b0a4] mb-5">
            Average focused time per section, in scroll order.
          </p>
          <div className="space-y-3.5">
            {sectionRows.map((r) => (
              <div key={r.section}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm text-[#1a1a18]">{r.label}</span>
                  <span className="text-xs text-[#6b6560]">
                    {formatDuration(r.avg)}
                    <span className="text-[#b8b0a4]">
                      {" "}
                      · {r.views.toLocaleString()} views
                    </span>
                  </span>
                </div>
                <Bar pct={(r.avg / maxDwell) * 100} />
              </div>
            ))}
          </div>
        </Card>

        {/* Top clicks */}
        <Card>
          <h2 className="font-heading text-lg text-[#1a1a18] mb-5">
            Top clicks
          </h2>
          {topClicks.length === 0 ? (
            <p className="text-sm text-[#b8b0a4]">No clicks recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topClicks.map((c) => (
                <div key={c.event_name}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm text-[#1a1a18]">
                      {CLICK_LABELS[c.event_name] ?? c.event_name}
                    </span>
                    <span className="text-xs text-[#6b6560]">
                      {num(c.clicks).toLocaleString()}
                    </span>
                  </div>
                  <Bar pct={(num(c.clicks) / maxClicks) * 100} color="bg-deep" />
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

    </div>
  );
}

