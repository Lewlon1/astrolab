import { describe, expect, it } from "vitest";
import { drawCards } from "../deck";
import { CARDS } from "@/content/lab/cards";

function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("drawCards", () => {
  it("returns three distinct cards from the pool", () => {
    for (let k = 0; k < 50; k++) {
      const hand = drawCards(CARDS);
      expect(hand).toHaveLength(3);
      expect(new Set(hand.map((c) => c.name)).size).toBe(3);
      for (const c of hand) expect(CARDS).toContain(c);
    }
  });

  it("is deterministic for an injected random", () => {
    expect(drawCards([1, 2, 3, 4, 5], 3, seq([0]))).toEqual([1, 2, 3]);
    expect(drawCards([1, 2, 3, 4, 5], 3, seq([0.999]))).toEqual([5, 1, 2]);
  });

  it("does not mutate the pool and caps at the pool size", () => {
    const pool = [1, 2];
    expect(drawCards(pool, 3, seq([0.5]))).toHaveLength(2);
    expect(pool).toEqual([1, 2]);
  });
});
