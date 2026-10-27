import { beforeEach, describe, expect, it, vi } from "vitest";

const { updates, isCalls, signIn, upsertSub, recordEvt, state } = vi.hoisted(() => ({
  updates: [] as unknown[],
  isCalls: [] as unknown[][],
  signIn: vi.fn(async () => ({ error: null })),
  upsertSub: vi.fn(async () => "id"),
  recordEvt: vi.fn(async () => "lead1"),
  state: { liveRow: null as { id: string; user_id: string | null } | null, transitThrows: false },
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOtp: signIn } }) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.is = () => q;
      q.maybeSingle = async () => ({ data: state.liveRow, error: null });
      q.update = (v: unknown) => {
        updates.push(v);
        return {
          eq: () => {
            const r = Promise.resolve({ error: null }) as Promise<{ error: null }> & { is: (c: string, v: unknown) => Promise<{ error: null }> };
            r.is = async (c, val) => {
              isCalls.push([c, val]);
              return { error: null };
            };
            return r;
          },
        };
      };
      q.insert = () => ({ select: () => ({ single: async () => ({ data: { id: "new" }, error: null }) }) });
      return q;
    },
  }),
}));
vi.mock("@/lib/lab/geocode", () => ({
  GeocodeBusyError: class extends Error {},
  GeocodeConfigError: class extends Error {},
  geocode: async () => ({ lat: 51.5, lon: -0.1, displayName: "London", tz: "Europe/London" }),
}));
vi.mock("@/lib/lab/mailerlite", async (orig) => ({ ...(await orig<typeof import("@/lib/lab/mailerlite")>()), upsertLabSubscriber: upsertSub }));
vi.mock("@/lib/lab/nextTransit", async (orig) => {
  const actual = await orig<typeof import("@/lib/lab/nextTransit")>();
  return {
    ...actual,
    seasonsForChart: (...args: Parameters<typeof actual.seasonsForChart>) => {
      if (state.transitThrows) throw new Error("boom");
      return actual.seasonsForChart(...args);
    },
  };
});
vi.mock("@/lib/lab/events", () => ({ recordLeadEvent: recordEvt }));
vi.mock("@/lib/lab/rateLimit", () => ({ gateLimiter: { allow: () => true }, clientIp: () => "1.1.1.1" }));

import { POST } from "./route";
import { CONSENT_TEXT_VERSION } from "@/content/lab/privacy";
import { CARDS } from "@/content/lab/cards";

const req = (date = "1990-06-15") =>
  new Request("http://localhost/api/lab/gate", {
    method: "POST",
    body: JSON.stringify({
      email: "a@b.co", date, place: "London", card: CARDS[0].name,
      consent: true, consentVersion: CONSENT_TEXT_VERSION,
    }),
  });

const PID = "3f1c2b8e-4a5d-4c6e-9f70-1a2b3c4d5e6f";

describe("gate route", () => {
  beforeEach(() => {
    delete process.env.LAB_SESSION_SECRET;
    signIn.mockResolvedValue({ error: null });
    updates.length = 0;
    isCalls.length = 0;
    state.transitThrows = false;
    vi.clearAllMocks();
  });

  it("claimed row: no field writes, no MailerLite, still sends link and ok", async () => {
    state.liveRow = { id: "p1", user_id: "u1" };
    const res = await POST(req());
    expect(await res.json()).toEqual({ ok: true, profile: false, emailSent: true });
    expect(updates).toHaveLength(0);
    expect(upsertSub).not.toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledOnce();
    expect(recordEvt).toHaveBeenCalledOnce();
  });

  it("unclaimed row: updates fields and syncs MailerLite", async () => {
    state.liveRow = { id: "p1", user_id: null };
    const res = await POST(req());
    expect(await res.json()).toEqual({ ok: true, profile: false, emailSent: true });
    expect(updates.length).toBeGreaterThan(0);
    expect(upsertSub).toHaveBeenCalledOnce();
  });

  it("a transit computation failure does not block signup: null transit fields, link still sent", async () => {
    state.liveRow = { id: "p1", user_id: null };
    state.transitThrows = true;
    const res = await POST(req());
    expect(await res.json()).toEqual({ ok: true, profile: false, emailSent: true });
    expect(updates[0]).toMatchObject({ next_transit: null, transit_peak_date: null });
    expect(signIn).toHaveBeenCalledOnce();
    expect(upsertSub).toHaveBeenCalledWith(
      "a@b.co",
      expect.objectContaining({ next_transit: "", transit_peak_date: "" }),
    );
  });

  it("unclaimed update is guarded by user_id IS NULL so a concurrent claim is never overwritten", async () => {
    state.liveRow = { id: "p1", user_id: null };
    await POST(req());
    expect(isCalls).toContainEqual(["user_id", null]);
  });

  it("sends 'X or Y' to MailerLite for a cusp Sun, a single sign otherwise", async () => {
    state.liveRow = { id: "p1", user_id: null };
    await POST(req("1990-06-21"));
    const cusp = upsertSub.mock.calls[0] as unknown as [string, { sun_sign: string; moon_sign: string }];
    expect(cusp[1].sun_sign).toBe("Gemini or Cancer");
    upsertSub.mockClear();
    await POST(req("1990-06-15"));
    const plain = upsertSub.mock.calls[0] as unknown as [string, { sun_sign: string }];
    expect(plain[1].sun_sign).toBe("Gemini");
  });

  describe("instant profile cookie", () => {
    beforeEach(() => {
      process.env.LAB_SESSION_SECRET = "s".repeat(40);
    });

    it("unclaimed row: sets a signed httpOnly cookie and says the profile is ready", async () => {
      state.liveRow = { id: PID, user_id: null };
      const res = await POST(req());
      expect(await res.json()).toEqual({ ok: true, profile: true, emailSent: true });
      const cookie = res.cookies.get("lab_profile");
      expect(cookie?.value.startsWith(`${PID}.`)).toBe(true);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe("lax");
    });

    it("claimed row: no cookie, so the visitor falls back to the email link", async () => {
      state.liveRow = { id: PID, user_id: "u1" };
      const res = await POST(req());
      expect(await res.json()).toEqual({ ok: true, profile: false, emailSent: true });
      expect(res.cookies.get("lab_profile")).toBeUndefined();
    });

    it("a failed sign-in email does not block an unclaimed profile", async () => {
      state.liveRow = { id: PID, user_id: null };
      signIn.mockResolvedValue({ error: { status: 429 } } as never);
      const res = await POST(req());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, profile: true, emailSent: false });
      expect(res.cookies.get("lab_profile")).toBeDefined();
    });

    it("a failed sign-in email on a claimed profile is still an error", async () => {
      state.liveRow = { id: PID, user_id: "u1" };
      signIn.mockResolvedValue({ error: { status: 429 } } as never);
      expect((await POST(req())).status).toBe(502);
    });

    it("without LAB_SESSION_SECRET there is no cookie and a failed email is an error", async () => {
      delete process.env.LAB_SESSION_SECRET;
      state.liveRow = { id: PID, user_id: null };
      const ok = await POST(req());
      expect(await ok.json()).toEqual({ ok: true, profile: false, emailSent: true });
      expect(ok.cookies.get("lab_profile")).toBeUndefined();
      signIn.mockResolvedValue({ error: { status: 429 } } as never);
      expect((await POST(req())).status).toBe(502);
    });
  });
});
