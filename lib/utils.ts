export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Lead badge styling and labels.
 *
 * The vocabulary itself lives in lib/leadStages.ts. These re-exports keep the
 * existing `leadStatusColors[lead.status]` call sites working while sourcing
 * their values from one place — and, unlike the maps they replace, they cover
 * every source the importers actually write. `mailerlite` and `csv_import`
 * rendered as unstyled grey pills before this.
 *
 * Legacy keys are included so a row read between the migration being applied
 * and the code being deployed still renders with the right colour.
 */
import {
  SOURCE_COLORS,
  STAGE_COLORS,
  formatSource as formatSourceLabel,
  formatStage,
  normalizeSource,
  normalizeStage,
} from "./leadStages";

const LEGACY_STAGE_KEYS = [
  "new",
  "voice_note_sent",
  "nurturing",
  "converted",
] as const;

const LEGACY_SOURCE_KEYS = ["website_form", "event_qr"] as const;

export const leadStatusColors: Record<string, { bg: string; text: string }> = {
  ...STAGE_COLORS,
  ...Object.fromEntries(
    LEGACY_STAGE_KEYS.map((k) => [k, STAGE_COLORS[normalizeStage(k)]])
  ),
};

export const leadSourceColors: Record<string, { bg: string; text: string }> = {
  ...SOURCE_COLORS,
  ...Object.fromEntries(
    LEGACY_SOURCE_KEYS.map((k) => {
      const normalized = normalizeSource(k);
      return [k, normalized ? SOURCE_COLORS[normalized] : SOURCE_COLORS.manual];
    })
  ),
};

/** @deprecated Prefer `formatStage` from lib/leadStages. */
export function formatStatus(status: string): string {
  return formatStage(status);
}

export function formatSource(source: string): string {
  return formatSourceLabel(source);
}
