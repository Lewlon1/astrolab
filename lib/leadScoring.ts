/**
 * Lead scoring engine.
 *
 * Every weight is read from the `lead_scoring_config` table at request time —
 * nothing here hard-codes a number. Changing a weight in the admin config panel
 * reorders the queue and every future action batch with no redeploy.
 *
 * The rubric itself is UNVALIDATED. It is a starting guess, and the whole point
 * of keeping it in config is that it will be wrong and need retuning.
 */

import type {
  Lead,
  LeadEvent,
  ScoreFactor,
  ScoredLead,
  ScoringWeights,
} from "@/types";

/**
 * Fallback weights, used only when `lead_scoring_config` is unreadable or has
 * not been seeded yet (the SQL file has not been run). Keeps the queue usable
 * instead of ranking everything zero. Mirrors the INSERT in
 * sql/lead-queue-daily-actions.sql.
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  recency_decay_days: 30,
  w_pricing_click: 30,
  w_story_reply: 25,
  w_code_delivered: 20,
  w_email_click: 12,
  w_email_open: 4,
  w_event_attended: 18,
  w_manychat_optin: 10,
  w_stage_new: 5,
  w_stage_voice_note: 15,
  w_stage_nurturing: 10,
  w_stage_booked: 0,
  w_stage_converted: 0,
  penalty_unsubscribed: 50,
  penalty_recent_touch: 20,
};

/** Event type → weight key. Anything unmapped contributes nothing. */
const EVENT_WEIGHT_KEYS: Record<string, string> = {
  pricing_click: "w_pricing_click",
  story_reply: "w_story_reply",
  code_delivered: "w_code_delivered",
  clicked: "w_email_click",
  opened: "w_email_open",
  event_attended: "w_event_attended",
  subscribed: "w_manychat_optin",
};

const STAGE_WEIGHT_KEYS: Record<string, string> = {
  new: "w_stage_new",
  voice_note_sent: "w_stage_voice_note",
  nurturing: "w_stage_nurturing",
  booked: "w_stage_booked",
  converted: "w_stage_converted",
};

const EVENT_LABELS: Record<string, string> = {
  pricing_click: "Viewed pricing",
  story_reply: "Replied to a story",
  code_delivered: "Love code delivered",
  clicked: "Clicked an email link",
  opened: "Opened an email",
  event_attended: "Attended an event",
  subscribed: "Opted in",
};

const DAY_MS = 86_400_000;

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / DAY_MS);
}

/**
 * Exponential decay on a half-life of `recency_decay_days`: an event exactly
 * one half-life old counts half. Undated events are treated as current rather
 * than discarded, so a missing timestamp never silently zeroes a real signal.
 */
export function recencyMultiplier(
  occurredAt: string | null | undefined,
  halfLifeDays: number
): number {
  const age = daysSince(occurredAt);
  if (age === null) return 1;
  if (halfLifeDays <= 0) return 1;
  return Math.pow(0.5, age / halfLifeDays);
}

/**
 * Reads weights from Supabase, falling back to DEFAULT_WEIGHTS per-key.
 *
 * Typed loosely on purpose: this only needs `from().select()`, and pinning it
 * to the full SupabaseClient generic would couple the scoring engine to the
 * client version for no benefit.
 */
export async function loadWeights(supabase: {
  from: (table: string) => {
    select: (columns: string) => PromiseLike<{
      data: { key: string; value: number | string }[] | null;
      error: unknown;
    }>;
  };
}): Promise<ScoringWeights> {
  const weights: ScoringWeights = { ...DEFAULT_WEIGHTS };

  try {
    const { data, error } = await supabase
      .from("lead_scoring_config")
      .select("key, value");
    if (error || !data) return weights;

    for (const row of data) {
      const n = typeof row.value === "number" ? row.value : Number(row.value);
      if (Number.isFinite(n)) weights[row.key] = n;
    }
  } catch {
    // Table not created yet — defaults keep the queue working.
  }

  return weights;
}

function weight(weights: ScoringWeights, key: string): number {
  const v = weights[key];
  return Number.isFinite(v) ? v : (DEFAULT_WEIGHTS[key] ?? 0);
}

/**
 * Score one lead against its event history.
 *
 * Repeat events of the same type are summed but each is decayed individually,
 * so ten opens last year rank below one pricing click today.
 */
export function scoreLead(
  lead: Lead,
  events: LeadEvent[],
  weights: ScoringWeights
): ScoredLead {
  const halfLife = weight(weights, "recency_decay_days");
  const factors: ScoreFactor[] = [];

  // --- Behavioural signals, decayed by age ---
  const byType = new Map<string, number>();
  for (const ev of events) {
    const key = EVENT_WEIGHT_KEYS[ev.type];
    if (!key) continue;
    const points = weight(weights, key) * recencyMultiplier(ev.occurred_at, halfLife);
    byType.set(ev.type, (byType.get(ev.type) ?? 0) + points);
  }

  for (const [type, points] of Array.from(byType.entries())) {
    if (Math.abs(points) < 0.5) continue;
    factors.push({
      key: type,
      label: EVENT_LABELS[type] ?? type,
      points: Math.round(points),
    });
  }

  // --- Stage bonus ---
  const stageKey = STAGE_WEIGHT_KEYS[lead.status];
  if (stageKey) {
    const points = weight(weights, stageKey);
    if (points !== 0) {
      factors.push({
        key: `stage_${lead.status}`,
        label: `Stage: ${lead.status.replace(/_/g, " ")}`,
        points: Math.round(points),
      });
    }
  }

  // --- Penalties ---
  if (lead.unsubscribed) {
    factors.push({
      key: "unsubscribed",
      label: "Unsubscribed",
      points: -Math.round(weight(weights, "penalty_unsubscribed")),
    });
  }

  const sinceTouch = daysSince(lead.last_actioned_at);
  if (sinceTouch !== null && sinceTouch < 3) {
    factors.push({
      key: "recent_touch",
      label: "Actioned in the last 3 days",
      points: -Math.round(weight(weights, "penalty_recent_touch")),
    });
  }

  const score = factors.reduce((sum, f) => sum + f.points, 0);

  return {
    lead,
    score,
    factors,
    reason: buildReason(lead, events, factors),
    events,
  };
}

/**
 * "Why this lead, why now" — leads on the strongest positive signal, then adds
 * the timing that makes it actionable today.
 */
export function buildReason(
  lead: Lead,
  events: LeadEvent[],
  factors: ScoreFactor[]
): string {
  const top = factors
    .filter((f) => f.points > 0)
    .sort((a, b) => b.points - a.points)[0];

  const name = lead.name || lead.email;

  if (!top) {
    if (lead.unsubscribed) return `${name} has unsubscribed — no outreach.`;
    return `${name} is on the list with no recorded activity yet.`;
  }

  const latest = latestEventOfType(events, top.key);
  const age = daysSince(latest?.occurred_at);
  const when =
    age === null
      ? ""
      : age < 1
        ? " today"
        : age < 2
          ? " yesterday"
          : ` ${Math.round(age)} days ago`;

  const stage =
    lead.status === "voice_note_sent"
      ? " Voice note already sent — this is the follow-up."
      : lead.status === "booked"
        ? " Already booked."
        : lead.status === "converted"
          ? " Already converted."
          : "";

  return `${top.label.toLowerCase()}${when}.${stage}`.replace(/^./, (c) =>
    c.toUpperCase()
  );
}

export function latestEventOfType(
  events: LeadEvent[],
  type: string
): LeadEvent | null {
  let best: LeadEvent | null = null;
  for (const ev of events) {
    if (ev.type !== type) continue;
    if (!best || (ev.occurred_at ?? "") > (best.occurred_at ?? "")) best = ev;
  }
  return best;
}

/** Score and rank a whole list. Highest score first, newest as a tiebreak. */
export function scoreAndRank(
  leads: Lead[],
  eventsByLead: Map<string, LeadEvent[]>,
  weights: ScoringWeights
): ScoredLead[] {
  return leads
    .map((lead) => scoreLead(lead, eventsByLead.get(lead.id) ?? [], weights))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.lead.created_at) - Date.parse(a.lead.created_at)
    );
}

/** Groups a flat lead_events result set by lead_id. */
export function groupEventsByLead(events: LeadEvent[]): Map<string, LeadEvent[]> {
  const map = new Map<string, LeadEvent[]>();
  for (const ev of events) {
    if (!ev.lead_id) continue;
    const list = map.get(ev.lead_id);
    if (list) list.push(ev);
    else map.set(ev.lead_id, [ev]);
  }
  return map;
}
