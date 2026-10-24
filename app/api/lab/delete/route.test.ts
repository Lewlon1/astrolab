import { beforeEach, describe, expect, it, vi } from "vitest";

const { updates, forget, signOut, order } = vi.hoisted(() => ({
  updates: [] as unknown[],
  forget: vi.fn(async (...args: string[]) => args.length >= 0),
  signOut: vi.fn(async () => ({})),
  order: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }), signOut } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.is = () => q;
      q.maybeSingle = async () => ({ data: { id: "p1", email: "a@b.co" }, error: null });
      q.update = (v: unknown) => {
        updates.push(v);
        order.push("update");
        return { eq: async () => ({ error: null }) };
      };
      return q;
    },
  }),
}));
vi.mock("@/lib/lab/mailerlite", () => ({
  forgetSubscriber: async (email: string) => {
    order.push("forget");
    return forget(email);
  },
}));

import { POST } from "./route";

describe("delete route", () => {
  beforeEach(() => {
    updates.length = 0;
    order.length = 0;
    vi.clearAllMocks();
  });

  it("forgets the real email in MailerLite first, then scrubs every personal column", async () => {
    const res = await POST();
    expect(await res.json()).toEqual({ ok: true, mailerlite: true });
    expect(forget).toHaveBeenCalledWith("a@b.co");
    expect(order).toEqual(["forget", "update"]);
    expect(updates[0]).toMatchObject({
      email: "deleted+p1@invalid",
      birth_date: "1900-01-01",
      birth_time: null,
      birth_place_text: "",
      lat: 0,
      lon: 0,
      tz: "UTC",
      birth_utc: "1970-01-01T00:00:00Z",
      card_drawn: "",
      positions: {},
      src: null,
      next_transit: null,
      transit_peak_date: null,
    });
    expect((updates[0] as { deleted_at: string }).deleted_at).toBeTruthy();
    expect(signOut).toHaveBeenCalledOnce();
  });
});
