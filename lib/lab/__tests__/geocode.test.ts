import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { geocode, GeocodeBusyError } from "../geocode";

function fakeAdmin(opts: { cached?: Record<string, unknown> | null; slots?: (boolean | "error")[] }) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const slots = [...(opts.slots ?? [true])];
  const admin = {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.cached ?? null, error: null }) }) }),
      upsert,
    })),
    rpc: vi.fn(async () => {
      const s = slots.length > 1 ? slots.shift()! : slots[0];
      return s === "error" ? { data: null, error: { message: "no fn" } } : { data: s, error: null };
    }),
  };
  return { admin: admin as unknown as SupabaseClient, raw: admin, upsert };
}
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const sleep = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  process.env.NOMINATIM_USER_AGENT = "TestAgent/1.0 (t@example.com)";
  sleep.mockClear();
});

describe("geocode", () => {
  it("cache hit skips fetch", async () => {
    const { admin } = fakeAdmin({ cached: { lat: 51.5, lon: -0.12, display_name: "London", tz: "Europe/London" } });
    const f = vi.fn();
    const r = await geocode("  London  ", { admin, fetch: f as unknown as typeof fetch, sleep });
    expect(r).toEqual({ lat: 51.5, lon: -0.12, displayName: "London", tz: "Europe/London" });
    expect(f).not.toHaveBeenCalled();
  });

  it("miss calls Nominatim with the User-Agent, then caches", async () => {
    const { admin, upsert } = fakeAdmin({});
    const f = vi.fn().mockResolvedValue(ok([{ lat: "51.5073", lon: "-0.1276", display_name: "London, UK" }]));
    const r = await geocode("London", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 1e12 });
    expect(r).toMatchObject({ lat: 51.5073, lon: -0.1276, displayName: "London, UK", tz: "Europe/London" });
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toContain("nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=London");
    expect(init.headers["User-Agent"]).toBe("TestAgent/1.0 (t@example.com)");
    expect(init.headers["Accept-Language"]).toBe("en");
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("no results gives null", async () => {
    const { admin } = fakeAdmin({});
    const f = vi.fn().mockResolvedValue(ok([]));
    expect(await geocode("zzzzqq", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 2e12 })).toBeNull();
  });

  it("proceeds when the slot RPC errors", async () => {
    const { admin } = fakeAdmin({ slots: ["error"] });
    const f = vi.fn().mockResolvedValue(ok([]));
    await geocode("x place", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 3e12 });
    expect(f).toHaveBeenCalled();
  });

  it("retries once on a busy slot, then throws GeocodeBusyError", async () => {
    const { admin, raw } = fakeAdmin({ slots: [false] });
    const f = vi.fn();
    await expect(
      geocode("busy town", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 4e12 })
    ).rejects.toBeInstanceOf(GeocodeBusyError);
    expect(raw.rpc).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1100);
    expect(f).not.toHaveBeenCalled();
  });

  it("throws a config error without NOMINATIM_USER_AGENT", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    const { admin } = fakeAdmin({});
    await expect(geocode("anywhere", { admin, sleep })).rejects.toThrow(/NOMINATIM_USER_AGENT/);
  });

  it("still calls Nominatim when the admin client cannot be constructed", async () => {
    const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const f = vi.fn().mockResolvedValue(ok([{ lat: "48.8566", lon: "2.3522", display_name: "Paris, France" }]));
      const r = await geocode("Paris", { fetch: f as unknown as typeof fetch, sleep, now: () => 5e12 });
      expect(r).toMatchObject({ lat: 48.8566, lon: 2.3522, displayName: "Paris, France" });
      expect(f).toHaveBeenCalledOnce();
    } finally {
      if (saved !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
    }
  });
});
