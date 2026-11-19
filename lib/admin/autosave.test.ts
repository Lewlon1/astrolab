import { describe, expect, it, vi } from "vitest";
import { createAutosaver, type AutosaveState } from "./autosave";

type V = { title: string; body: string };

function setup(save: (v: V) => Promise<unknown> = async () => undefined) {
  const timers: Array<() => void> = [];
  const states: AutosaveState[] = [];
  const saveSpy = vi.fn(save);
  const s = createAutosaver<V>({
    initial: { title: "T", body: "" },
    save: (v) => saveSpy(v),
    validate: (v) => (v.title.trim() ? null : "Add a title to save"),
    onChange: (st) => states.push(st),
    setTimer: (fn) => {
      timers.push(fn);
      return timers.length - 1;
    },
    clearTimer: (h) => {
      timers[h as number] = () => {};
    },
  });
  const fire = async () => {
    const pending = timers.splice(0);
    pending.forEach((fn) => fn());
    await s.flush();
  };
  return { s, saveSpy, states, fire, last: () => states[states.length - 1] };
}

describe("createAutosaver", () => {
  it("debounces: many edits, one save of the latest value", async () => {
    const { s, saveSpy, fire, last } = setup();
    s.update({ title: "T", body: "a" });
    s.update({ title: "T", body: "ab" });
    s.update({ title: "T", body: "abc" });
    expect(last().status).toBe("pending");
    await fire();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith({ title: "T", body: "abc" });
    expect(last().status).toBe("saved");
    expect(s.hasUnsaved()).toBe(false);
  });

  it("does not save when the value is back to what was saved", async () => {
    const { s, saveSpy, fire } = setup();
    s.update({ title: "T", body: "x" });
    s.update({ title: "T", body: "" });
    await fire();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("blocks an empty title and says why, without calling save", async () => {
    const { s, saveSpy, fire, last } = setup();
    s.update({ title: "  ", body: "x" });
    await fire();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(last()).toEqual({ status: "blocked", message: "Add a title to save" });
    expect(s.hasUnsaved()).toBe(true);
  });

  it("saves edits made while a save is in flight right after it", async () => {
    let release!: () => void;
    const { s, saveSpy, last } = setup(
      (v) => (v.body === "1" ? new Promise<void>((r) => (release = r)) : Promise.resolve())
    );
    s.update({ title: "T", body: "1" });
    const first = s.flush();
    s.update({ title: "T", body: "2" });
    expect(last().status).toBe("saving");
    release();
    await first;
    expect(saveSpy.mock.calls.map((c) => c[0].body)).toEqual(["1", "2"]);
    expect(last().status).toBe("saved");
  });

  it("reports a failed save and retries on flush", async () => {
    let fail = true;
    const { s, saveSpy, last } = setup(async () => {
      if (fail) throw new Error("Network down");
    });
    s.update({ title: "T", body: "x" });
    await s.flush();
    expect(last()).toEqual({ status: "error", message: "Network down" });
    expect(s.hasUnsaved()).toBe(true);
    fail = false;
    await s.flush();
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(last().status).toBe("saved");
  });

  it("passes the save result to onSaved", async () => {
    const onSaved = vi.fn();
    const s = createAutosaver<string>({
      initial: "a",
      save: async () => ({ status: "filed" }),
      onSaved,
      onChange: () => {},
    });
    s.update("b");
    await s.flush();
    expect(onSaved).toHaveBeenCalledWith({ status: "filed" });
    s.dispose();
  });
});
