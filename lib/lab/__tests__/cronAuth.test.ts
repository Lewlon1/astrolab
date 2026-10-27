import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "../cronAuth";

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer header", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
  });
  it("rejects a missing, wrong or differently sized header", () => {
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3creT", "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3cret2", "s3cret")).toBe(false);
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
  });
  it("rejects everything when the secret is empty", () => {
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});
