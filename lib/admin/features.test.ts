import { describe, expect, it } from "vitest";
import { isAdminFeatureOn } from "./features";

describe("isAdminFeatureOn", () => {
  it("hides labs tools when the flag is unset", () => {
    expect(isAdminFeatureOn("videoEditor", undefined)).toBe(false);
    expect(isAdminFeatureOn("photoshop", undefined)).toBe(false);
  });

  it("hides labs tools for any value other than 1", () => {
    expect(isAdminFeatureOn("videoEditor", "true")).toBe(false);
    expect(isAdminFeatureOn("photoshop", "0")).toBe(false);
  });

  it("shows labs tools when the flag is 1", () => {
    expect(isAdminFeatureOn("videoEditor", "1")).toBe(true);
    expect(isAdminFeatureOn("photoshop", "1")).toBe(true);
  });
});
