import { describe, it, expect } from "vitest";
import { targetSize } from "./shrink";

describe("targetSize", () => {
  it("shrinks a landscape photo so the long edge is 2000", () => {
    expect(targetSize(4032, 3024)).toEqual({ width: 2000, height: 1500 });
  });

  it("shrinks a portrait photo so the long edge is 2000", () => {
    expect(targetSize(3024, 4032)).toEqual({ width: 1500, height: 2000 });
  });

  it("leaves a small image unchanged", () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
