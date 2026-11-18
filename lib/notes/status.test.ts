import { describe, it, expect } from "vitest";
import { effectiveStatus, openTodos, todayTodos, STALE_MS, type TodoWithNote } from "./status";

const now = new Date("2026-11-18T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe("effectiveStatus", () => {
  it("processing under 5 min stays processing", () => {
    expect(effectiveStatus({ status: "processing", created_at: ago(STALE_MS - 1000) }, now)).toBe("processing");
  });
  it("processing over 5 min is failed", () => {
    expect(effectiveStatus({ status: "processing", created_at: ago(STALE_MS + 1000) }, now)).toBe("failed");
  });
  it("done/failed unchanged", () => {
    expect(effectiveStatus({ status: "done", created_at: ago(STALE_MS * 10) }, now)).toBe("done");
    expect(effectiveStatus({ status: "failed", created_at: ago(1000) }, now)).toBe("failed");
  });
});

let n = 0;
function t(o: Partial<TodoWithNote> & { noteStatus?: "inbox" | "filed" | "archived" }): TodoWithNote {
  n++;
  const { noteStatus, ...rest } = o;
  return {
    id: `t${n}`,
    note_id: "n1",
    text: `task ${n}`,
    due_on: null,
    done_at: null,
    created_at: `2026-11-0${(n % 9) + 1}T10:00:00Z`,
    note: { id: "n1", title: "N", area: "todo", status: noteStatus ?? "filed" },
    ...rest,
  };
}

describe("openTodos", () => {
  it("excludes done tasks and archived notes", () => {
    const keep = t({});
    const out = openTodos([keep, t({ done_at: "2026-11-10T00:00:00Z" }), t({ noteStatus: "archived" })]);
    expect(out).toEqual([keep]);
  });
  it("includes inbox notes' tasks", () => {
    const a = t({ noteStatus: "inbox" });
    expect(openTodos([a])).toEqual([a]);
  });
  it("orders dated before undated, earliest first", () => {
    const undatedOld = t({ created_at: "2026-11-01T00:00:00Z" });
    const undatedNew = t({ created_at: "2026-11-05T00:00:00Z" });
    const late = t({ due_on: "2026-12-01" });
    const early = t({ due_on: "2026-11-10" });
    const input = [undatedOld, late, undatedNew, early];
    const copy = [...input];
    expect(openTodos(input)).toEqual([early, late, undatedNew, undatedOld]);
    expect(input).toEqual(copy);
  });
  it("orders equal due dates by older created_at first", () => {
    const newer = t({ due_on: "2026-11-10", created_at: "2026-11-05T00:00:00Z" });
    const older = t({ due_on: "2026-11-10", created_at: "2026-11-01T00:00:00Z" });
    expect(openTodos([newer, older])).toEqual([older, newer]);
  });
});

describe("todayTodos", () => {
  it("keeps overdue and due today, drops future and undated", () => {
    const over = t({ due_on: "2026-11-10" });
    const today = t({ due_on: "2026-11-18" });
    const future = t({ due_on: "2026-11-19" });
    const undated = t({});
    expect(todayTodos([future, undated, today, over], "2026-11-18")).toEqual([over, today]);
  });
});
