/**
 * Lead stage, track and source vocabulary.
 *
 * This is the ONLY module that knows the stage column in Supabase is still
 * called `status`. Everything else — types, API payloads, UI — says "stage".
 *
 * The column keeps its old name because migration 013 contains four
 * `CASE status WHEN …` expressions and docs/LEAD_FUNNEL.md tells the operator
 * 013 is re-runnable; renaming it would turn that instruction into an error.
 * Migration 015 may rename it once 013 is formally retired, at which point only
 * this file changes.
 *
 * Stage transitions are enforced in the database by the
 * `trg_leads_no_stage_regression` trigger (migration 014 §3.4). The helpers
 * here mirror that trigger so the UI never offers a move the database will
 * silently swallow — but the database, not this file, is the authority.
 */

// ----------------------------------------------------------------------------
// Vocabulary
// ----------------------------------------------------------------------------

export type LeadStage =
  | "lead"
  | "code_delivered"
  | "engaged"
  | "booked"
  | "client";

export type LeadTrack = "cold" | "warm";

export type LeadSource =
  // spec vocabulary
  | "website"
  | "lovecode"
  | "story_reply"
  | "event"
  | "referral"
  | "manual"
  // import provenance, written by the MailerLite sync and the ManyChat CSV
  | "manychat"
  | "mailerlite"
  | "csv_import";

/** Pipeline order. Index + 1 is the rank used by the regression check. */
export const STAGE_ORDER: readonly LeadStage[] = [
  "lead",
  "code_delivered",
  "engaged",
  "booked",
  "client",
] as const;

export const TRACKS: readonly LeadTrack[] = ["cold", "warm"] as const;

export const SOURCES: readonly LeadSource[] = [
  "website",
  "lovecode",
  "story_reply",
  "event",
  "referral",
  "manual",
  "manychat",
  "mailerlite",
  "csv_import",
] as const;

/**
 * Pre-014 stage values, mapped to their replacements.
 *
 * Rows can still carry these during the window between the SQL being applied by
 * hand and the code being deployed, so every read path goes through
 * `normalizeStage` rather than trusting the raw column.
 */
const LEGACY_STAGES: Record<string, LeadStage> = {
  new: "lead",
  voice_note_sent: "code_delivered",
  nurturing: "engaged",
  converted: "client",
};

/** Pre-014 source values, mapped to their replacements. */
const LEGACY_SOURCES: Record<string, LeadSource> = {
  website_form: "website",
  event_qr: "event",
};

// ----------------------------------------------------------------------------
// Ranking and transitions
// ----------------------------------------------------------------------------

/**
 * Mirrors the `lead_stage_rank` SQL function in migration 014 exactly,
 * including its tolerance of both vocabularies. An unrecognised value ranks 0,
 * below every real stage, so it can only ever move forwards.
 */
export function stageRank(stage: string | null | undefined): number {
  if (!stage) return 0;
  const normalized = LEGACY_STAGES[stage] ?? stage;
  const index = STAGE_ORDER.indexOf(normalized as LeadStage);
  return index === -1 ? 0 : index + 1;
}

/**
 * Coerce whatever is in the column into a renderable stage.
 *
 * Unrecognised values fall back to `lead` so the UI never renders a raw
 * database string; `stageRank` still ranks them 0, so the fallback cannot be
 * used to fake forward progress.
 */
export function normalizeStage(stage: string | null | undefined): LeadStage {
  if (!stage) return "lead";
  if (STAGE_ORDER.includes(stage as LeadStage)) return stage as LeadStage;
  return LEGACY_STAGES[stage] ?? "lead";
}

export function normalizeSource(
  source: string | null | undefined
): LeadSource | null {
  if (!source) return null;
  if (SOURCES.includes(source as LeadSource)) return source as LeadSource;
  return LEGACY_SOURCES[source] ?? null;
}

export function normalizeTrack(track: string | null | undefined): LeadTrack {
  return track === "warm" ? "warm" : "cold";
}

/**
 * True when `to` is strictly further along than `from`.
 *
 * Equal stages are not advances — a webhook re-delivering the same booking
 * should be a no-op, not a write.
 */
export function canAdvance(
  from: string | null | undefined,
  to: string | null | undefined
): boolean {
  return stageRank(to) > stageRank(from);
}

/** The lead_events types that imply a stage. */
export type StageDrivingEvent =
  | "capture"
  | "code_delivered"
  | "dm_reply"
  | "story_reply"
  | "pricing_click"
  | "clicked"
  | "booking"
  | "purchase";

const EVENT_TARGET_STAGE: Record<StageDrivingEvent, LeadStage> = {
  capture: "lead",
  code_delivered: "code_delivered",
  dm_reply: "engaged",
  story_reply: "engaged",
  pricing_click: "engaged",
  clicked: "engaged",
  booking: "booked",
  purchase: "client",
};

/**
 * The stage an event implies, or null when it implies none.
 *
 * Warm-track leads skip `code_delivered` entirely — they never receive a free
 * Code, so an event claiming otherwise is ignored rather than applied. This is
 * the whole reason `track` exists as a column.
 *
 * The caller still has to check `canAdvance`; this answers "where does this
 * event point", not "is that a legal move".
 */
export function nextStageFor(
  track: LeadTrack,
  event: string
): LeadStage | null {
  if (track === "warm" && event === "code_delivered") return null;
  return EVENT_TARGET_STAGE[event as StageDrivingEvent] ?? null;
}

// ----------------------------------------------------------------------------
// Display
// ----------------------------------------------------------------------------

export const STAGE_LABELS: Record<LeadStage, string> = {
  lead: "Lead",
  code_delivered: "Code delivered",
  engaged: "Engaged",
  booked: "Booked",
  client: "Client",
};

export const TRACK_LABELS: Record<LeadTrack, string> = {
  cold: "Cold",
  warm: "Warm",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  lovecode: "Love Code",
  story_reply: "Story reply",
  event: "Event",
  referral: "Referral",
  manual: "Manual",
  manychat: "ManyChat",
  mailerlite: "MailerLite",
  csv_import: "CSV import",
};

export const STAGE_COLORS: Record<LeadStage, { bg: string; text: string }> = {
  lead: { bg: "bg-orange-50", text: "text-orange-700" },
  code_delivered: { bg: "bg-blue-50", text: "text-blue-700" },
  engaged: { bg: "bg-purple-50", text: "text-purple-700" },
  booked: { bg: "bg-green-50", text: "text-green-700" },
  client: { bg: "bg-amber-50", text: "text-amber-700" },
};

export const TRACK_COLORS: Record<LeadTrack, { bg: string; text: string }> = {
  cold: { bg: "bg-slate-100", text: "text-slate-600" },
  warm: { bg: "bg-rose-50", text: "text-rose-700" },
};

export const SOURCE_COLORS: Record<LeadSource, { bg: string; text: string }> = {
  website: { bg: "bg-slate-100", text: "text-slate-600" },
  lovecode: { bg: "bg-pink-50", text: "text-pink-600" },
  story_reply: { bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
  event: { bg: "bg-indigo-50", text: "text-indigo-600" },
  referral: { bg: "bg-teal-50", text: "text-teal-700" },
  manual: { bg: "bg-stone-100", text: "text-stone-600" },
  manychat: { bg: "bg-sky-50", text: "text-sky-600" },
  mailerlite: { bg: "bg-emerald-50", text: "text-emerald-700" },
  csv_import: { bg: "bg-zinc-100", text: "text-zinc-600" },
};

export function formatStage(stage: string | null | undefined): string {
  return STAGE_LABELS[normalizeStage(stage)];
}

export function formatTrack(track: string | null | undefined): string {
  return TRACK_LABELS[normalizeTrack(track)];
}

export function formatSource(source: string | null | undefined): string {
  const normalized = normalizeSource(source);
  if (normalized) return SOURCE_LABELS[normalized];
  // An unmapped value is still worth showing rather than hiding.
  return source ?? "";
}

/**
 * What to call a lead in a list or a heading.
 *
 * Email is nullable from migration 014 onwards — a handle-only ManyChat import
 * has no address — so this is the only safe way to label a row.
 */
export function leadDisplayName(lead: {
  name?: string | null;
  email?: string | null;
  ig_handle?: string | null;
}): string {
  if (lead.name) return lead.name;
  if (lead.email) return lead.email;
  if (lead.ig_handle) return `@${lead.ig_handle.replace(/^@/, "")}`;
  return "Anonymous";
}
