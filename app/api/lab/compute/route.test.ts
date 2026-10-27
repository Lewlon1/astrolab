import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { candidates: [] as { lat: number; lon: number; displayName: string; tz: string }[] };
vi.mock("@/lib/lab/geocode", () => ({
  GeocodeBusyError: class extends Error {},
  GeocodeConfigError: class extends Error {},
  geocode: async () => state.candidates[0] ?? null,
  geocodeCandidates: vi.fn(async () => state.candidates),
}));
vi.mock("@/lib/lab/rateLimit", () => ({ computeLimiter: { allow: () => true }, clientIp: () => "1.1.1.1" }));

import { POST } from "./route";
import { geocodeCandidates } from "@/lib/lab/geocode";
import { CARDS } from "@/content/lab/cards";

const santiagoCL = { lat: -33.4569, lon: -70.6483, displayName: "Santiago, Región Metropolitana, 8320000, Chile", tz: "America/Santiago" };
const santiagoES = { lat: 42.8805, lon: -8.5457, displayName: "Santiago de Compostela, Galicia, España", tz: "Europe/Madrid" };

const req = (extra: Record<string, unknown> = {}) =>
  new Request("http://localhost/api/lab/compute", {
    method: "POST",
    body: JSON.stringify({ date: "1990-06-15", place: "Santiago", card: CARDS[0].name, ...extra }),
  });

describe("compute route place resolution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks the visitor to choose when the name is ambiguous, and computes nothing", async () => {
    state.candidates = [santiagoCL, santiagoES];
    const body = await (await POST(req())).json();
    expect(body.reading).toBeUndefined();
    expect(body.choices).toHaveLength(2);
    expect(body.choices[0].label).toBe("Santiago, Región Metropolitana, Chile");
  });

  it("computes straight away when exactly one place matches", async () => {
    state.candidates = [santiagoCL];
    const body = await (await POST(req())).json();
    expect(body.reading).toBeDefined();
    expect(body.place).toMatchObject({ label: "Santiago, Región Metropolitana, Chile", tz: "America/Santiago" });
  });

  it("uses the chosen place without geocoding, deriving the zone itself", async () => {
    const geo = { lat: santiagoES.lat, lon: santiagoES.lon, displayName: santiagoES.displayName };
    const body = await (await POST(req({ geo }))).json();
    expect(geocodeCandidates).not.toHaveBeenCalled();
    expect(body.place.tz).toBe("Europe/Madrid");
    expect(body.reading).toBeDefined();
  });

  it("404s on no match", async () => {
    state.candidates = [];
    const res = await POST(req());
    expect(res.status).toBe(404);
  });
});
