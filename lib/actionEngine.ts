/**
 * Daily Actions engine.
 *
 * Deterministic — no AI. Every action is ranked from data already in Supabase
 * and every reason string is a template. (Optional Bedrock polish is a later
 * iteration, deliberately not this one.)
 *
 * The constraint this encodes is conversion and follow-up, not activity volume.
 * Two rules carry that:
 *   1. Tier 1 conversion work is never trimmed to make room for filler.
 *   2. When the real work runs out, the batch comes up short and says so.
 *      There is no code path that invents an action to reach ten.
 */

import { daysSince } from "@/lib/leadScoring";
import type {
  ActionTier,
  CandidateAction,
  EngagementAccount,
  RitualCalendarItem,
  ScoredLead,
  TankStatus,
} from "@/types";

export const BATCH_SIZE = 10;
export const TIME_BUDGET_MINUTES = 45;
export const MAX_ENGAGEMENT_PER_DAY = 3;
/** Two skips of the same lead-action suppress it for this long. */
export const SUPPRESSION_DAYS = 7;
/** A code delivered with no reply becomes a follow-up after this many days. */
const FOLLOW_UP_AFTER_DAYS = 14;

const IG_INBOX = "https://www.instagram.com/direct/inbox/";
const BUSINESS_SUITE = "https://business.facebook.com/latest/inbox/all";
const CANVA = "https://www.canva.com/folder/all-designs";
const CAL_BOOKINGS = "https://app.cal.com/bookings/upcoming";

export interface EngineInput {
  scoredLeads: ScoredLead[];
  rituals: RitualCalendarItem[];
  targets: EngagementAccount[];
  /** Local date the batch is for, as YYYY-MM-DD. */
  today: string;
  /** dedupe_keys already used today, so regeneration never repeats an action. */
  usedKeys: Set<string>;
  /** dedupe_keys suppressed by repeated skips. */
  suppressedKeys: Set<string>;
  /** Handles engaged yesterday — never the same account on consecutive days. */
  engagedYesterday: Set<string>;
}

export interface AssembledBatch {
  items: CandidateAction[];
  totalMinutes: number;
  tank: TankStatus;
}

function leadLink(leadId: string, handle?: string | null): string {
  return handle ? `https://instagram.com/${handle.replace(/^@/, "")}` : `/admin/lead-queue?lead=${leadId}`;
}

function displayName(scored: ScoredLead): string {
  return scored.lead.name || scored.lead.ig_handle || scored.lead.email;
}

function hasEvent(scored: ScoredLead, type: string): boolean {
  return scored.events.some((e) => e.type === type);
}

function latestAge(scored: ScoredLead, type: string): number | null {
  let newest: string | null = null;
  for (const e of scored.events) {
    if (e.type === type) {
      if (!newest || (e.occurred_at ?? "") > newest) newest = e.occurred_at;
    }
  }
  return daysSince(newest);
}

function round(n: number): number {
  return Math.max(1, Math.round(n));
}

// ---------------------------------------------------------------------------
// Tier 1 — Conversion. Derived entirely from Lead Queue state.
// ---------------------------------------------------------------------------

function tier1Candidates(input: EngineInput): CandidateAction[] {
  const out: CandidateAction[] = [];

  for (const scored of input.scoredLeads) {
    const { lead } = scored;

    // Converted, booked and unsubscribed leads are not conversion work.
    if (lead.unsubscribed) continue;
    if (lead.status === "converted") continue;

    const name = displayName(scored);
    const link = leadLink(lead.id, lead.ig_handle);

    // -- Unanswered story-reply conversation (kit pattern 6) --
    // An open conversation is the warmest thing on the board, so it outranks
    // the rest of Tier 1.
    //
    // "Unanswered" means the reply is newer than the last thing Gabs did, not
    // merely that she has never actioned this lead — otherwise one reply years
    // ago would silence every future conversation with them.
    const storyAge = latestAge(scored, "story_reply");
    const actionedAge = latestAge(scored, "actioned");
    const stillUnanswered =
      storyAge !== null && (actionedAge === null || storyAge < actionedAge);

    if (stillUnanswered) {
      out.push({
        lead_id: lead.id,
        target_id: null,
        tier: 1,
        type: "story_reply_answer",
        title: `Answer ${name}'s story reply`,
        reason: `They replied to a story ${storyAge < 1 ? "today" : `${round(storyAge)} days ago`} and it is still unanswered. An open conversation goes cold fastest — kit pattern 6.`,
        est_minutes: 4,
        link: lead.ig_handle ? link : IG_INBOX,
        dedupe_key: `story_reply_answer:${lead.id}`,
      });
      continue;
    }

    // -- Voice note owed --
    // Opted in, engaged, still sitting at `new`.
    if (lead.status === "new" && scored.score > 0) {
      const age = daysSince(lead.created_at);
      out.push({
        lead_id: lead.id,
        target_id: null,
        tier: 1,
        type: "voice_note",
        title: `Send ${name} a voice note`,
        reason: `${scored.reason} Still at "new"${age !== null && age >= 1 ? ` after ${round(age)} days` : ""} — the voice note is what moves them.`,
        est_minutes: 5,
        link: lead.ig_handle ? link : `mailto:${lead.email}`,
        dedupe_key: `voice_note:${lead.id}`,
      });
      continue;
    }

    // -- Booking nudge: pricing click, no booking (kit pattern 3) --
    if (hasEvent(scored, "pricing_click") && !hasEvent(scored, "booking") && lead.status !== "booked") {
      const age = latestAge(scored, "pricing_click");
      out.push({
        lead_id: lead.id,
        target_id: null,
        tier: 1,
        type: "booking_nudge",
        title: `Nudge ${name} towards booking`,
        reason: `Looked at pricing ${age === null ? "recently" : age < 1 ? "today" : `${round(age)} days ago`} and has not booked. Strongest buying signal on the board — kit pattern 3.`,
        est_minutes: 4,
        link: lead.ig_handle ? link : `mailto:${lead.email}`,
        dedupe_key: `booking_nudge:${lead.id}`,
      });
      continue;
    }

    // -- Personal follow-up: code delivered, silent 14d+ (kit pattern 4) --
    const codeAge = latestAge(scored, "code_delivered");
    if (codeAge !== null && codeAge >= FOLLOW_UP_AFTER_DAYS && lead.status !== "booked") {
      out.push({
        lead_id: lead.id,
        target_id: null,
        tier: 1,
        type: "follow_up",
        title: `Follow up with ${name}`,
        reason: `Love code delivered ${round(codeAge)} days ago with no reply since. Past the ${FOLLOW_UP_AFTER_DAYS}-day mark — kit pattern 4.`,
        est_minutes: 5,
        link: lead.ig_handle ? link : `mailto:${lead.email}`,
        dedupe_key: `follow_up:${lead.id}`,
      });
      continue;
    }

    // -- Voice note sent, no reply: one follow-up, then leave them alone --
    if (lead.status === "voice_note_sent") {
      const age = daysSince(lead.last_actioned_at);
      if (age !== null && age >= FOLLOW_UP_AFTER_DAYS) {
        out.push({
          lead_id: lead.id,
          target_id: null,
          tier: 1,
          type: "follow_up",
          title: `Follow up with ${name}`,
          reason: `Voice note sent ${round(age)} days ago, no reply. One follow-up, then let it rest — kit pattern 4.`,
          est_minutes: 4,
          link: lead.ig_handle ? link : `mailto:${lead.email}`,
          dedupe_key: `follow_up:${lead.id}`,
        });
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Tier 2 — Ritual. Fixtures due today.
// ---------------------------------------------------------------------------

function tier2Candidates(input: EngineInput): CandidateAction[] {
  const weekday = new Date(`${input.today}T12:00:00Z`).getUTCDay();

  const linkFor = (type: string): string =>
    type === "story_ritual"
      ? BUSINESS_SUITE
      : type === "batch_prep"
        ? CANVA
        : type === "testimonial_ask"
          ? CAL_BOOKINGS
          : "/admin/events";

  return input.rituals
    .filter((r) => r.active && (r.on_date === input.today || (r.on_date === null && r.weekday === weekday)))
    .map((r) => ({
      lead_id: null,
      target_id: null,
      tier: 2 as ActionTier,
      type: r.type,
      title: r.title,
      reason: r.reason ?? `Scheduled fixture for today.`,
      est_minutes: r.est_minutes ?? 15,
      link: r.link ?? linkFor(r.type),
      dedupe_key: `ritual:${r.id}:${input.today}`,
    }));
}

// ---------------------------------------------------------------------------
// Tier 3 — Engagement. Human-executed; the action links, Gabs writes.
// ---------------------------------------------------------------------------

function tier3Candidates(input: EngineInput): CandidateAction[] {
  return input.targets
    .filter((t) => t.is_active)
    .filter((t) => !input.engagedYesterday.has(t.handle.toLowerCase()))
    .sort((a, b) => {
      // Longest-unengaged first; never-engaged accounts lead.
      const av = a.last_engaged_at ?? "";
      const bv = b.last_engaged_at ?? "";
      return av === bv ? a.handle.localeCompare(b.handle) : av < bv ? -1 : 1;
    })
    .map((t) => {
      const age = daysSince(t.last_engaged_at);
      return {
        lead_id: null,
        target_id: t.id,
        tier: 3 as ActionTier,
        type: "comment_engage",
        title: `Comment on ${t.handle}`,
        reason:
          age === null
            ? `Never engaged with. ${t.why_engage ?? "On the curated list."}`
            : `Last engaged ${round(age)} days ago — longest gap on the list. ${t.why_engage ?? ""}`.trim(),
        est_minutes: 3,
        link: `https://instagram.com/${t.handle.replace(/^@/, "")}`,
        dedupe_key: `comment_engage:${t.id}:${input.today}`,
      };
    });
}

// ---------------------------------------------------------------------------
// Tier 4 — Maintenance. Padding only, and a deliberately finite list: this is
// what stops the engine from being able to manufacture a tenth action.
// ---------------------------------------------------------------------------

function tier4Candidates(input: EngineInput): CandidateAction[] {
  return [
    {
      lead_id: null,
      target_id: null,
      tier: 4 as ActionTier,
      type: "story_from_bank",
      title: "Post a story from the content bank",
      reason: "Keeps the account warm on a day with no higher-value work.",
      est_minutes: 5,
      link: CANVA,
      dedupe_key: `story_from_bank:${input.today}`,
    },
    {
      lead_id: null,
      target_id: null,
      tier: 4 as ActionTier,
      type: "save_references",
      title: "Save 3 content references for Sunday's batch",
      reason: "Feeds the Sunday batch prep so it starts from material, not a blank page.",
      est_minutes: 5,
      link: "https://www.instagram.com/",
      dedupe_key: `save_references:${input.today}`,
    },
    {
      lead_id: null,
      target_id: null,
      tier: 4 as ActionTier,
      type: "update_testimonials",
      title: "Update the testimonials doc",
      reason: "Social proof compounds; five minutes now saves a scramble later.",
      est_minutes: 5,
      link: "/admin/testimonials",
      dedupe_key: `update_testimonials:${input.today}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function usable(c: CandidateAction, input: EngineInput): boolean {
  return !input.usedKeys.has(c.dedupe_key) && !input.suppressedKeys.has(c.dedupe_key);
}

/**
 * Build and rank every candidate, then fill a batch in tier order.
 *
 * Tier 1 fills first and is allowed to break the time budget — if conversion
 * work alone is worth more than 45 minutes, that is the honest answer and the
 * batch simply carries no filler. Tiers 2–4 are only added while the batch
 * stays inside the budget.
 */
export function generateBatch(input: EngineInput): AssembledBatch {
  const t1 = tier1Candidates(input).filter((c) => usable(c, input));
  const t2 = tier2Candidates(input).filter((c) => usable(c, input));
  const t3 = tier3Candidates(input)
    .filter((c) => usable(c, input))
    .slice(0, MAX_ENGAGEMENT_PER_DAY);
  const t4 = tier4Candidates(input).filter((c) => usable(c, input));

  const items: CandidateAction[] = [];
  let minutes = 0;
  let timeCapped = false;

  // Tier 1 — never trimmed for filler.
  for (const c of t1) {
    if (items.length >= BATCH_SIZE) break;
    items.push(c);
    minutes += c.est_minutes;
  }

  // Tiers 2–4 — budget-bound.
  for (const tier of [t2, t3, t4]) {
    for (const c of tier) {
      if (items.length >= BATCH_SIZE) break;
      if (minutes + c.est_minutes > TIME_BUDGET_MINUTES) {
        timeCapped = true;
        continue;
      }
      items.push(c);
      minutes += c.est_minutes;
    }
  }

  const chosen = new Set(items.map((i) => i.dedupe_key));
  const remaining = (list: CandidateAction[]) =>
    list.filter((c) => !chosen.has(c.dedupe_key)).length;

  const tier1Remaining = remaining(t1);
  const tier2Remaining = remaining(t2);
  const tier3Remaining = remaining(t3);

  return {
    items,
    totalMinutes: minutes,
    tank: buildTankStatus({
      tier1Remaining,
      tier2Remaining,
      tier3Remaining,
      timeCapped,
      batch: items,
    }),
  };
}

/**
 * The honesty banner. It is allowed to say "stop" — that is the point.
 */
export function buildTankStatus(args: {
  tier1Remaining: number;
  tier2Remaining: number;
  tier3Remaining: number;
  timeCapped: boolean;
  batch: CandidateAction[];
}): TankStatus {
  const { tier1Remaining, tier2Remaining, tier3Remaining, timeCapped, batch } = args;
  const highValueExhausted = tier1Remaining === 0 && tier2Remaining === 0;

  const inBatch = (tier: ActionTier) => batch.filter((b) => b.tier === tier).length;
  const conversionInBatch = inBatch(1);
  const maintenanceInBatch = inBatch(4);

  const parts: string[] = [];

  if (batch.length === 0) {
    return {
      tier1Remaining,
      tier2Remaining,
      tier3Remaining,
      highValueExhausted: true,
      timeCapped,
      message:
        "Nothing left to serve today. No conversion work is owed, no ritual is due, and the engagement list is already covered. That is a finished day, not an empty one.",
    };
  }

  if (conversionInBatch > 0) {
    parts.push(
      `${conversionInBatch} conversion action${conversionInBatch === 1 ? "" : "s"} in this batch`
    );
  }

  if (tier1Remaining > 0) {
    parts.push(
      `${tier1Remaining} more conversion action${tier1Remaining === 1 ? "" : "s"} waiting after this`
    );
  } else if (conversionInBatch === 0) {
    parts.push("no conversion work owed right now");
  }

  if (tier2Remaining > 0) {
    parts.push(`${tier2Remaining} ritual item${tier2Remaining === 1 ? "" : "s"} still due`);
  }

  if (maintenanceInBatch > 0 && tier1Remaining === 0) {
    parts.push(
      `the last ${maintenanceInBatch} ${maintenanceInBatch === 1 ? "is" : "are"} maintenance`
    );
  }

  let message = parts.join("; ") + ".";
  message = message.charAt(0).toUpperCase() + message.slice(1);

  if (timeCapped) {
    message += ` Batch stopped at the ${TIME_BUDGET_MINUTES}-minute budget rather than padding it out.`;
  }

  if (batch.length < BATCH_SIZE) {
    message += ` ${batch.length} action${batch.length === 1 ? "" : "s"} today, not ${BATCH_SIZE} — there was nothing real left to add.`;
  }

  if (highValueExhausted) {
    message +=
      " The high-value work is done for today. Stopping here is the right call.";
  }

  return {
    tier1Remaining,
    tier2Remaining,
    tier3Remaining,
    highValueExhausted,
    timeCapped,
    message,
  };
}

/**
 * Given every action ever skipped, the dedupe_keys currently suppressed.
 * Two skips of the same lead-action buys it a 7-day rest.
 */
export function computeSuppressedKeys(
  skipped: { dedupe_key: string; created_at: string }[]
): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const row of skipped) {
    const list = byKey.get(row.dedupe_key);
    if (list) list.push(row.created_at);
    else byKey.set(row.dedupe_key, [row.created_at]);
  }

  const suppressed = new Set<string>();
  for (const [key, dates] of Array.from(byKey.entries())) {
    if (dates.length < 2) continue;
    dates.sort();
    const age = daysSince(dates[dates.length - 1]);
    if (age !== null && age < SUPPRESSION_DAYS) suppressed.add(key);
  }
  return suppressed;
}
