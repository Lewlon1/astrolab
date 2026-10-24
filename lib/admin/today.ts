/**
 * Pure helpers for the admin home ("Today") screen.
 */
import type { ActionItem, EngagementAccount } from "@/types";

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

export interface EngagementTask {
  item: ActionItem;
  /** null when the account was deleted or deactivated after the batch was generated. */
  account: EngagementAccount | null;
}

/**
 * Today's engagement (Tier 3) actions joined to their accounts, pending first.
 * Expired items are dropped; done/skipped stay so the page shows progress.
 */
export function engagementTasks(
  items: ActionItem[],
  accounts: EngagementAccount[]
): EngagementTask[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const order = { pending: 0, done: 1, skipped: 2, expired: 3 } as const;
  return items
    .filter((i) => i.tier === 3 && i.status !== "expired")
    .sort((a, b) => order[a.status] - order[b.status])
    .map((item) => ({ item, account: item.target_id ? byId.get(item.target_id) ?? null : null }));
}
