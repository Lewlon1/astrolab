import { describe, expect, it } from "vitest";
import { assignVariant, getVariant, isQa } from "../experiments";

const base = { cookie: undefined, qaCookie: undefined, override: null, splitOff: false };

/** Small seeded PRNG so the split check is deterministic. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("assignVariant", () => {
  it("first visit draws a variant and sets the cookie", () => {
    expect(assignVariant({ ...base, random: () => 0.1 })).toEqual({ variant: "a", qa: false, setVariantCookie: "a", setQaCookie: false });
    expect(assignVariant({ ...base, random: () => 0.9 }).variant).toBe("b");
  });

  it("is sticky: an existing cookie wins and nothing is rewritten", () => {
    expect(assignVariant({ ...base, cookie: "b", random: () => 0 })).toEqual({ variant: "b", qa: false, setVariantCookie: null, setQaCookie: false });
  });

  it("?v= forces the variant and flags QA", () => {
    const r = assignVariant({ ...base, cookie: "a", override: "B" });
    expect(r).toEqual({ variant: "b", qa: true, setVariantCookie: "b", setQaCookie: true });
    // QA stays flagged on later visits without ?v=
    expect(assignVariant({ ...base, cookie: "b", qaCookie: "1" }).qa).toBe(true);
  });

  it("ignores junk overrides", () => {
    expect(assignVariant({ ...base, cookie: "b", override: "c" }).variant).toBe("b");
  });

  it("LP_SPLIT=off gives A to everyone, even with a B cookie", () => {
    expect(assignVariant({ ...base, cookie: "b", splitOff: true })).toEqual({ variant: "a", qa: false, setVariantCookie: null, setQaCookie: false });
  });

  it("200 first visits split between 40/60 and 60/40", () => {
    for (const seed of [1, 7, 42, 2027]) {
      const rnd = mulberry32(seed);
      let b = 0;
      for (let i = 0; i < 200; i++) if (assignVariant({ ...base, random: rnd }).variant === "b") b++;
      expect(b).toBeGreaterThanOrEqual(80);
      expect(b).toBeLessThanOrEqual(120);
    }
  });

});

describe("getVariant / isQa", () => {
  const h = (m: Record<string, string>) => ({ get: (k: string) => m[k] ?? null });
  const c = (m: Record<string, string>) => ({ get: (k: string) => (k in m ? { value: m[k] } : undefined) });

  it("prefers the middleware header, then the cookie, else A", () => {
    expect(getVariant(h({ "x-lp-variant": "b" }), c({ lp_v: "a" }))).toBe("b");
    expect(getVariant(h({}), c({ lp_v: "b" }))).toBe("b");
    expect(getVariant(h({}), c({}))).toBe("a");
  });

  it("reads QA from header or cookie", () => {
    expect(isQa(h({ "x-lp-qa": "1" }), c({}))).toBe(true);
    expect(isQa(h({ "x-lp-qa": "0" }), c({ lp_qa: "1" }))).toBe(false);
    expect(isQa(h({}), c({ lp_qa: "1" }))).toBe(true);
  });
});
