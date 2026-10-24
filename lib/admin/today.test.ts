import { describe, expect, it } from "vitest";
import type { ActionItem } from "@/types";
import type { EngagementAccount } from "@/types";
import { engagementTasks, splitToday } from "./today";

let n = 0;
function item(tier: 1 | 2 | 3 | 4, status: ActionItem["status"] = "pending"): ActionItem {
  n += 1;
  return {
    id: `a${n}`,
    lead_id: null,
    target_id: null,
    tier,
    type: "x",
    title: `Action ${n}`,
    reason: null,
    est_minutes: 3,
    link: null,
    status,
    generated_for: "2026-10-08",
    batch: 1,
    dedupe_key: `k${n}`,
    completed_at: null,
    created_at: "2026-10-08T08:00:00Z",
  };
}

describe("splitToday", () => {
  it("groups pending items by tier", () => {
    const s = splitToday([item(1), item(3), item(3), item(2), item(4)]);
    expect(s.clients).toHaveLength(1);
    expect(s.engage).toHaveLength(2);
    expect(s.other).toHaveLength(2);
  });

  it("leaves resolved items out of the sections but counts them as done", () => {
    const s = splitToday([item(1, "done"), item(3, "skipped"), item(3)]);
    expect(s.clients).toHaveLength(0);
    expect(s.engage).toHaveLength(1);
    expect(s.done).toBe(2);
    expect(s.total).toBe(3);
  });

  it("ignores expired items in the total", () => {
    expect(splitToday([item(1, "expired"), item(1)]).total).toBe(1);
  });

  it("handles an empty batch", () => {
    expect(splitToday([])).toMatchObject({ done: 0, total: 0, clients: [], engage: [], other: [] });
  });
});

describe("engagementTasks", () => {
  const account = (id: string): EngagementAccount => ({
    id,
    handle: `@${id}`,
    platform: "instagram",
    followers: null,
    niche: null,
    why_engage: null,
    is_active: true,
    created_at: "",
  });

  it("keeps only tier 3, joins accounts, and puts pending first", () => {
    const done = { ...item(3, "done"), target_id: "acc1" };
    const pending = { ...item(3), target_id: "acc2" };
    const tasks = engagementTasks([done, item(1), pending, item(3, "expired")], [account("acc1"), account("acc2")]);
    expect(tasks.map((t) => t.item.id)).toEqual([pending.id, done.id]);
    expect(tasks[0].account?.handle).toBe("@acc2");
  });

  it("returns a null account when it no longer exists", () => {
    const orphan = { ...item(3), target_id: "gone" };
    expect(engagementTasks([orphan], [])[0].account).toBeNull();
  });
});
