import { describe, expect, it } from "vitest";
import { ASPECTS, angularDistance, findAspect } from "@/lib/astro/aspects";

describe("aspects", () => {
  it("angularDistance is 0–180 and wraps", () => {
    expect(angularDistance(10, 350)).toBeCloseTo(20, 10);
    expect(angularDistance(0, 180)).toBeCloseTo(180, 10);
    expect(angularDistance(90, 300)).toBeCloseTo(150, 10);
  });

  it("finds the closest aspect within the default orb", () => {
    expect(ASPECTS.trine).toBe(120);
    expect(findAspect(10, 133)).toEqual({ type: "trine", orb: expect.closeTo(3, 10) });
    expect(findAspect(0, 358)).toEqual({ type: "conjunction", orb: expect.closeTo(2, 10) });
    expect(findAspect(0, 40)).toBeNull();
  });

  it("supports per-aspect orbs", () => {
    expect(findAspect(0, 64, { default: 6, sextile: 3 })).toBeNull();
    expect(findAspect(0, 98, { default: 6, square: 8 })).toEqual({
      type: "square",
      orb: expect.closeTo(8, 10),
    });
  });
});
