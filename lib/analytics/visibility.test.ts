import { describe, it, expect } from "vitest";
import { isSectionVisible, VISIBILITY_THRESHOLDS } from "./visibility";

describe("isSectionVisible", () => {
  it("short section: needs half of the section", () => {
    const base = { targetHeight: 400, viewportHeight: 800 };
    expect(isSectionVisible({ ...base, intersectionHeight: 150 })).toBe(false);
    expect(isSectionVisible({ ...base, intersectionHeight: 200 })).toBe(true);
  });

  it("tall section on a phone: half the viewport is enough", () => {
    const base = { targetHeight: 3000, viewportHeight: 800 };
    expect(isSectionVisible({ ...base, intersectionHeight: 250 })).toBe(false);
    expect(isSectionVisible({ ...base, intersectionHeight: 400 })).toBe(true);
  });

  it("tolerates sub-pixel under-reporting", () => {
    expect(
      isSectionVisible({ intersectionHeight: 399.6, targetHeight: 3000, viewportHeight: 800 })
    ).toBe(true);
  });

  it("is false for zero or invalid sizes", () => {
    expect(isSectionVisible({ intersectionHeight: 0, targetHeight: 0, viewportHeight: 800 })).toBe(false);
    expect(isSectionVisible({ intersectionHeight: 10, targetHeight: 500, viewportHeight: 0 })).toBe(false);
    expect(isSectionVisible({ intersectionHeight: 0, targetHeight: 500, viewportHeight: 800 })).toBe(false);
    expect(isSectionVisible({ intersectionHeight: NaN, targetHeight: 500, viewportHeight: 800 })).toBe(false);
  });
});

describe("VISIBILITY_THRESHOLDS", () => {
  it("covers 0..1 in 5% steps", () => {
    expect(VISIBILITY_THRESHOLDS[0]).toBe(0);
    expect(VISIBILITY_THRESHOLDS.at(-1)).toBe(1);
    expect(VISIBILITY_THRESHOLDS).toHaveLength(21);
  });
});
