import { beforeEach, describe, expect, it, vi } from "vitest";

const { updates, updateFields } = vi.hoisted(() => ({
  updates: [] as unknown[],
  updateFields: vi.fn(async () => "id"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.is = () => q;
      q.maybeSingle = async () => ({
        data: { id: "p1", email: "a@b.co", birth_date: "1990-06-21", lat: 51.5, lon: -0.1, tz: "Europe/London" },
        error: null,
      });
      q.update = (v: unknown) => {
        updates.push(v);
        return { eq: async () => ({ error: null }) };
      };
      return q;
    },
  }),
}));
vi.mock("@/lib/lab/mailerlite", async (orig) => ({ ...(await orig<typeof import("@/lib/lab/mailerlite")>()), updateLabFields: updateFields }));

import { POST } from "./route";

describe("birth-time route", () => {
  beforeEach(() => {
    updates.length = 0;
    vi.clearAllMocks();
  });

  it("syncs settled sun and moon signs (no 'X or Y') along with the transit fields", async () => {
    const res = await POST(new Request("http://localhost/api/lab/birth-time", { method: "POST", body: JSON.stringify({ time: "12:00" }) }));
    expect(await res.json()).toEqual({ ok: true });
    expect(updateFields).toHaveBeenCalledOnce();
    const [email, fields] = updateFields.mock.calls[0] as unknown as [string, Record<string, string>];
    expect(email).toBe("a@b.co");
    // The 1990 solstice fell at 20:33 UT on 21 June, so noon local is still Gemini.
    expect(fields.sun_sign).toBe("Gemini");
    expect(fields.sun_sign).not.toContain(" or ");
    expect(fields.moon_sign).toBeTruthy();
    expect(fields.moon_sign).not.toContain(" or ");
    expect(fields).toHaveProperty("next_transit");
    expect(fields).toHaveProperty("transit_peak_date");
  });
});
