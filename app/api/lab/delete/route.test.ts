import { beforeEach, describe, expect, it, vi } from "vitest";

const { updates, forget, signOut, order, state } = vi.hoisted(() => ({
  updates: [] as unknown[],
  forget: vi.fn(async (...args: string[]) => args.length >= 0),
  signOut: vi.fn(async () => ({})),
  order: [] as string[],
  state: { user: { id: "u1" } as { id: string } | null, cookie: undefined as string | undefined },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }), signOut } }),
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
vi.mock("@/lib/lab/viewer", async (orig) => ({
  ...(await orig<typeof import("@/lib/lab/viewer")>()),
  readLabCookie: async () => state.cookie,
}));
vi.mock("@/lib/lab/mailerlite", () => ({
  forgetSubscriber: async (email: string) => {
    order.push("forget");
    return forget(email);
  },
}));

import { POST } from "./route";
import { signSession } from "@/lib/lab/session";

describe("delete route", () => {
  beforeEach(() => {
    updates.length = 0;
    order.length = 0;
    vi.clearAllMocks();
    state.user = { id: "u1" };
    state.cookie = undefined;
    process.env.LAB_SESSION_SECRET = "s".repeat(40);
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

  it("401 with no session and no cookie, and deletes nothing", async () => {
    state.user = null;
    const res = await POST();
    expect(res.status).toBe(401);
    expect(updates).toHaveLength(0);
    expect(forget).not.toHaveBeenCalled();
  });

  it("a cookie viewer can delete their profile; no sign-out, the cookie is cleared", async () => {
    state.user = null;
    state.cookie = signSession("3f1c2b8e-4a5d-4c6e-9f70-1a2b3c4d5e6f")!;
    const res = await POST();
    expect(await res.json()).toEqual({ ok: true, mailerlite: true });
    expect(updates).toHaveLength(1);
    expect(signOut).not.toHaveBeenCalled();
    expect(res.cookies.get("lab_profile")).toMatchObject({ value: "", maxAge: 0 });
  });
});
