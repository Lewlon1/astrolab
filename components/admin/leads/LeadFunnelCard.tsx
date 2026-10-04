"use client";

import type { FunnelCounts } from "@/types";
import { STAGE_LABELS, STAGE_ORDER, type LeadStage } from "@/lib/leadStages";

/**
 * Two funnels, deliberately adjacent.
 *
 * The left one counts SESSIONS, from the analytics_funnel RPC. The right one
 * counts PEOPLE, from the stage column. They will never match, and that is
 * fine — one browser can be several sessions, and a lead can arrive without a
 * session at all (every MailerLite and ManyChat import does).
 *
 * They used to live on two different pages under near-identical headings,
 * which is how you end up with an admin who trusts neither number. Putting
 * them side by side with their units named makes the gap legible instead of
 * suspicious.
 */

interface Props {
  /** Session funnel from the analytics_funnel RPC. */
  funnel: FunnelCounts;
  /** People per stage, counted from the leads table. */
  stageCounts: Record<LeadStage, number>;
  /** False when the analytics migrations have not been applied. */
  analyticsAvailable: boolean;
}

const SESSION_STEPS: { key: keyof FunnelCounts; label: string }[] = [
  { key: "visit", label: "Visited" },
  { key: "engaged", label: "Read a section" },
  { key: "cta_click", label: "Clicked a CTA" },
  { key: "lead", label: "Signed up" },
  { key: "booking", label: "Confirmed booking" },
];

function Bar({
  label,
  value,
  max,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  sub?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-xs text-[#6b6560]">{label}</span>
        <span className="text-xs text-[#1a1a18] tabular-nums">
          {value}
          {sub ? <span className="text-[#b8b0a4]"> · {sub}</span> : null}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f0ede8] overflow-hidden">
        <div
          className="h-full rounded-full bg-deep transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LeadFunnelCard({
  funnel,
  stageCounts,
  analyticsAvailable,
}: Props) {
  const sessionMax = funnel.visit || 1;

  // The stage funnel is cumulative: someone at `booked` has, by definition,
  // been a lead. Counting each stage in isolation would render a funnel that
  // widens in the middle and reads as a bug.
  const cumulative = STAGE_ORDER.map((stage, i) => ({
    stage,
    count: STAGE_ORDER.slice(i).reduce((sum, s) => sum + (stageCounts[s] ?? 0), 0),
  }));
  const stageMax = cumulative[0]?.count || 1;

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h3 className="font-heading text-base text-[#1a1a18]">
            Traffic funnel
          </h3>
          <p className="text-xs text-[#b8b0a4] mb-4">
            Sessions, from first-party analytics
          </p>

          {analyticsAvailable ? (
            <div className="space-y-3">
              {SESSION_STEPS.map((step) => (
                <Bar
                  key={step.key}
                  label={step.label}
                  value={funnel[step.key] ?? 0}
                  max={sessionMax}
                  sub={
                    sessionMax > 0
                      ? `${Math.round(((funnel[step.key] ?? 0) / sessionMax) * 100)}%`
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#b8b0a4]">
              Analytics not available — the reporting migrations have not been
              applied to this database.
            </p>
          )}
        </section>

        <section>
          <h3 className="font-heading text-base text-[#1a1a18]">Lead funnel</h3>
          <p className="text-xs text-[#b8b0a4] mb-4">
            People, by stage — reached this stage or beyond
          </p>

          <div className="space-y-3">
            {cumulative.map(({ stage, count }) => (
              <Bar
                key={stage}
                label={STAGE_LABELS[stage]}
                value={count}
                max={stageMax}
                sub={`${stageCounts[stage] ?? 0} here now`}
              />
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 pt-4 border-t border-[#f0ede8] text-[11px] text-[#b8b0a4]">
        These two do not reconcile, by design. The left counts sessions in the
        selected window; the right counts people at every stage, including leads
        that never had a web session — every MailerLite sync and CSV import.
      </p>
    </div>
  );
}
