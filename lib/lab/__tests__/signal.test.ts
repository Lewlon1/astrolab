import { describe, expect, it } from "vitest";
import { approval, pick, sortSignal, SIGNAL_SORTS, type SignalRow } from "../signal";

const row = (p: Partial<SignalRow>): SignalRow => ({
  level: "card", card: "The Star", relation: null, sun_sign: null,
  votes: 0, ups: 0, downs: 0, signups: 0, booking_clicks: 0, bookings: 0, paid: 0, score: 0, ...p,
});

describe("lab signal helpers", () => {
  it("approval is the share of thumbs up, null with no votes", () => {
    expect(approval({ ups: 3, votes: 4 })).toBe(0.75);
    expect(approval({ ups: 0, votes: 0 })).toBeNull();
  });

  it("pick falls back on unknown or repeated query values", () => {
    expect(pick("votes", SIGNAL_SORTS, "score")).toBe("votes");
    expect(pick("drop table", SIGNAL_SORTS, "score")).toBe("score");
    expect(pick(["votes"], SIGNAL_SORTS, "score")).toBe("score");
  });

  it("filters by level, sorts descending, coerces string counts, breaks ties on votes then name", () => {
    const rows = [
      row({ card: "The Tower", score: 5, votes: 2 }),
      row({ card: "The Star", score: "11" as unknown as number, votes: 3 }),
      row({ card: "Death", score: 5, votes: 4 }),
      row({ card: "The Moon", score: 5, votes: 4 }),
      row({ level: "sun", card: "The Star", sun_sign: "Leo", score: 99 }),
    ];
    expect(sortSignal(rows, "card", "score").map((r) => r.card)).toEqual(["The Star", "Death", "The Moon", "The Tower"]);
    expect(sortSignal(rows, "card", "score")[0].score).toBe(11);
    expect(sortSignal(rows, "sun", "score")).toHaveLength(1);
  });

  it("sorts by approval with no-vote rows last", () => {
    const rows = [row({ card: "A", ups: 0, votes: 0 }), row({ card: "B", ups: 1, votes: 2 }), row({ card: "C", ups: 2, votes: 2 })];
    expect(sortSignal(rows, "card", "approval").map((r) => r.card)).toEqual(["C", "B", "A"]);
  });
});
