import { beforeEach, describe, expect, it, vi } from "vitest";

const { upserts, state } = vi.hoisted(() => ({
  upserts: [] as { table: string; row: Record<string, unknown>; opts: unknown }[],
  state: { allow: true, error: null as null | { code: string } },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      upsert: async (row: Record<string, unknown>, opts: unknown) => {
        upserts.push({ table, row, opts });
        return { error: state.error };
      },
    }),
  }),
}));
vi.mock("@/lib/lab/rateLimit", () => ({ feedbackLimiter: { allow: () => state.allow }, clientIp: () => "1.1.1.1" }));

import { POST } from "./route";

const DRAW = "0b9c1d2e-3f40-4a51-8b62-7c83d94ea5f6";
const good = { drawId: DRAW, vote: 1, card: "The Star", sun: ["Pisces"], moon: ["Gemini", "Cancer"], relation: "tension", hasTime: false, src: "bio" };
const req = (body: unknown) =>
  new Request("http://localhost/api/lab/feedback", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

describe("feedback route", () => {
  beforeEach(() => {
    upserts.length = 0;
    state.allow = true;
    state.error = null;
  });

  it("stores a vote keyed by draw id, with 'X or Y' for an ambiguous sign", async () => {
    const res = await POST(req(good));
    expect(res.status).toBe(204);
    expect(upserts).toHaveLength(1);
    expect(upserts[0].table).toBe("lab_reading_feedback");
    expect(upserts[0].opts).toEqual({ onConflict: "draw_id" });
    expect(upserts[0].row).toMatchObject({
      draw_id: DRAW, vote: 1, card: "The Star", sun_sign: "Pisces", moon_sign: "Gemini or Cancer",
      relation: "tension", has_time: false, src: "bio",
    });
  });

  it("never writes lab_profile_id, so a changed vote cannot unlink a profile", async () => {
    await POST(req({ ...good, vote: -1, lab_profile_id: "x" }));
    expect(upserts[0].row).not.toHaveProperty("lab_profile_id");
    expect(upserts[0].row.vote).toBe(-1);
  });

  it.each([
    ["bad draw id", { ...good, drawId: "nope" }],
    ["vote 0", { ...good, vote: 0 }],
    ["vote as string", { ...good, vote: "1" }],
    ["unknown card", { ...good, card: "The Joker" }],
    ["unknown sign", { ...good, sun: ["Ophiuchus"] }],
    ["three signs", { ...good, moon: ["Aries", "Taurus", "Gemini"] }],
    ["sign as string", { ...good, sun: "Pisces" }],
    ["bad relation", { ...good, relation: "love" }],
  ])("rejects %s with 400 and no write", async (_name, body) => {
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(upserts).toHaveLength(0);
  });

  it("rejects malformed JSON", async () => {
    expect((await POST(req("{"))).status).toBe(400);
  });

  it("rate-limits with 429", async () => {
    state.allow = false;
    expect((await POST(req(good))).status).toBe(429);
    expect(upserts).toHaveLength(0);
  });

  it("a database error is a 500 that does not echo details", async () => {
    state.error = { code: "42P01" };
    const res = await POST(req(good));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("42P01");
  });
});
