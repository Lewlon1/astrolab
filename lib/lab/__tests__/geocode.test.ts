import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dedupeCandidates, geocode, geocodeCandidates, GeocodeBusyError } from "../geocode";
import { shortPlaceLabel } from "../placeLabel";

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
    const { admin } = fakeAdmin({
      cached: { candidates: [{ lat: 51.5, lon: -0.12, displayName: "London", tz: "Europe/London" }] },
    });
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
    expect(String(url)).toContain("nominatim.openstreetmap.org/search?");
    expect(String(url)).toContain("q=London");
    expect(String(url)).toContain("featuretype=settlement");
    expect(init.headers["User-Agent"]).toBe("TestAgent/1.0 (t@example.com)");
    expect(init.headers["Accept-Language"]).toBe("es,en;q=0.8");
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("no results gives null, after retrying without the settlement filter", async () => {
    const { admin } = fakeAdmin({});
    const f = vi.fn().mockResolvedValue(ok([]));
    expect(await geocode("zzzzqq", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 2e12 })).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
    expect(String(f.mock.calls[0][0])).toContain("featuretype=settlement");
    expect(String(f.mock.calls[1][0])).not.toContain("featuretype");
  });

  it("falls back to a non-settlement place, but never a street or shop", async () => {
    const { admin } = fakeAdmin({});
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(
        ok([
          { lat: "40.4", lon: "-3.7", display_name: "Calle Mayor, Madrid", category: "highway" },
          { lat: "40.5", lon: "-3.6", display_name: "Comunidad de Madrid, España", category: "boundary" },
        ]),
      );
    const r = await geocodeCandidates("madrid", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 6e12 });
    expect(r.map((c) => c.displayName)).toEqual(["Comunidad de Madrid, España"]);
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

  describe("Spanish and ambiguous names", () => {
    const santiago = [
      { lat: "9.8680", lon: "-83.7960", display_name: "Santiago, Paraíso, Cartago, Costa Rica" },
      { lat: "-33.4569", lon: "-70.6483", display_name: "Santiago, Provincia de Santiago, Región Metropolitana, 8320000, Chile" },
      { lat: "42.8805", lon: "-8.5457", display_name: "Santiago de Compostela, Galicia, España" },
    ];

    it("returns every distinct candidate for an ambiguous name, in rank order", async () => {
      const { admin } = fakeAdmin({});
      const f = vi.fn().mockResolvedValue(ok(santiago));
      const r = await geocodeCandidates("Santiago", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 7e12 });
      expect(r).toHaveLength(3);
      expect(r[0].displayName).toContain("Costa Rica");
      expect(r.map((c) => c.tz)).toEqual(["America/Costa_Rica", "America/Santiago", "Europe/Madrid"]);
    });

    it("merges near-duplicates, as for Nueva York's node and boundary", async () => {
      const { admin } = fakeAdmin({});
      const f = vi.fn().mockResolvedValue(
        ok([
          { lat: "40.7127", lon: "-74.0060", display_name: "New York, United States" },
          { lat: "40.7130", lon: "-74.0072", display_name: "New York, United States" },
        ]),
      );
      const r = await geocodeCandidates("Nueva York", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 8e12 });
      expect(r).toHaveLength(1);
      expect(r[0].tz).toBe("America/New_York");
    });

    it("caps the list at five", async () => {
      const { admin } = fakeAdmin({});
      const many = Array.from({ length: 9 }, (_, i) => ({ lat: String(10 + i), lon: String(20 + i), display_name: `Place ${i}` }));
      const f = vi.fn().mockResolvedValue(ok(many));
      const r = await geocodeCandidates("Place", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 9e12 });
      expect(r).toHaveLength(5);
    });

    it("keeps accented and unaccented queries as separate, well-formed requests", async () => {
      const { admin } = fakeAdmin({});
      const f = vi.fn().mockResolvedValue(ok([{ lat: "4.711", lon: "-74.0721", display_name: "Bogotá, Colombia" }]));
      await geocodeCandidates("Bogotá", { admin, fetch: f as unknown as typeof fetch, sleep, now: () => 10e12 });
      expect(String(f.mock.calls[0][0])).toContain("q=Bogot%C3%A1");
    });
  });
});

describe("dedupeCandidates", () => {
  it("keeps places further apart than 30 km", () => {
    const a = { lat: 40, lon: -3, displayName: "a", tz: "Europe/Madrid" };
    const b = { lat: 40.1, lon: -3, displayName: "b", tz: "Europe/Madrid" };
    const c = { lat: 41, lon: -3, displayName: "c", tz: "Europe/Madrid" };
    expect(dedupeCandidates([a, b, c]).map((x) => x.displayName)).toEqual(["a", "c"]);
  });
});

describe("shortPlaceLabel", () => {
  it("drops postcodes and the middle of a long name", () => {
    expect(shortPlaceLabel("Santiago, Provincia de Santiago, Santiago Metropolitan Region, 8320000, Chile")).toBe(
      "Santiago, Santiago Metropolitan Region, Chile",
    );
  });
  it("leaves short names alone", () => {
    expect(shortPlaceLabel("Ciudad de México, México")).toBe("Ciudad de México, México");
  });
});
