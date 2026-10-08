/**
 * Pure helpers for the admin home ("Today") screen.
 */
import type { ActionItem } from "@/types";

export interface TodaySections {
  /** Tier 1 — conversion / follow-up with people closest to booking. */
  clients: ActionItem[];
  /** Tier 3 — comment on curated Instagram accounts. */
  engage: ActionItem[];
  /** Tiers 2 + 4 — rituals and maintenance. */
  other: ActionItem[];
  done: number;
  total: number;
}

/** Splits today's batch into the home-screen sections. Pending items only; counts cover all. */
export function splitToday(items: ActionItem[]): TodaySections {
  const pending = items.filter((i) => i.status === "pending");
  return {
    clients: pending.filter((i) => i.tier === 1),
    engage: pending.filter((i) => i.tier === 3),
    other: pending.filter((i) => i.tier === 2 || i.tier === 4),
    // Skipped counts as handled: the point is "nothing left waiting on you".
    done: items.filter((i) => i.status === "done" || i.status === "skipped").length,
    total: items.filter((i) => i.status !== "expired").length,
  };
}
