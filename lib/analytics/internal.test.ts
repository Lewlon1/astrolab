import { describe, it, expect } from "vitest";
import { applyInternalParam, isInternal } from "./internal";

function fakeStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("internal-traffic flag", () => {
  it("is off by default", () => {
    expect(isInternal(fakeStore())).toBe(false);
  });

  it("?internal=1 turns it on and it persists", () => {
    const s = fakeStore();
    applyInternalParam("?internal=1", s);
    expect(isInternal(s)).toBe(true);
    applyInternalParam("", s); // later page loads without the param keep it
    expect(isInternal(s)).toBe(true);
  });

  it("?internal=0 turns it off", () => {
    const s = fakeStore();
    applyInternalParam("?internal=1", s);
    applyInternalParam("?x=1&internal=0", s);
    expect(isInternal(s)).toBe(false);
  });

  it("ignores other values", () => {
    const s = fakeStore();
    applyInternalParam("?internal=yes", s);
    expect(isInternal(s)).toBe(false);
  });

  it("never throws when storage is missing or throws", () => {
    expect(isInternal(null)).toBe(false);
    expect(() => applyInternalParam("?internal=1", null)).not.toThrow();
    const bad = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(isInternal(bad)).toBe(false);
    expect(() => applyInternalParam("?internal=1", bad)).not.toThrow();
  });
});
