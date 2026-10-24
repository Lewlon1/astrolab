// Server-only by convention (the `server-only` package is not installed).
// Place -> coordinates + IANA zone, via Nominatim with a Supabase cache.
//
// Nominatim's policy allows ~1 request/second and requires an identifying
// User-Agent. We take a cross-instance slot with the lab_take_slot() RPC and
// also throttle inside the process. If the RPC errors (e.g. migration 016 not
// run yet) we proceed to Nominatim anyway rather than fail the visitor; the
// in-process throttle still applies. Cache read/write failures never break a lookup.

import type { SupabaseClient } from "@supabase/supabase-js";
import { zoneFor } from "@/lib/astro";
import { createAdminClient } from "@/lib/supabase/admin";

export type GeocodeResult = { lat: number; lon: number; displayName: string; tz: string };

export class GeocodeBusyError extends Error {
  constructor() {
    super("Geocoder is busy");
    this.name = "GeocodeBusyError";
  }
}
export class GeocodeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodeConfigError";
  }
}

export type GeocodeDeps = {
  admin?: SupabaseClient;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

const SLOT_MS = 1100;
let lastCallAt = 0;

export function normaliseQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function geocode(query: string, deps: GeocodeDeps = {}): Promise<GeocodeResult | null> {
  const key = normaliseQuery(query);
  if (!key) return null;
  const admin = deps.admin ?? createAdminClient();
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? realSleep;
  const now = deps.now ?? Date.now;

  // 1. Cache
  try {
    const { data } = await admin
      .from("lab_geocode_cache")
      .select("lat, lon, display_name, tz")
      .eq("query", key)
      .maybeSingle();
    if (data && Number.isFinite(data.lat) && Number.isFinite(data.lon)) {
      return {
        lat: data.lat,
        lon: data.lon,
        displayName: data.display_name ?? query.trim(),
        tz: data.tz || zoneFor(data.lat, data.lon),
      };
    }
  } catch {
    // cache unavailable: fall through to a live lookup
  }

  // 2. Config
  const userAgent = process.env.NOMINATIM_USER_AGENT;
  if (!userAgent) throw new GeocodeConfigError("NOMINATIM_USER_AGENT is not set.");

  // 3. Cross-instance slot, one retry
  if (!(await takeSlot(admin))) {
    await sleep(SLOT_MS);
    if (!(await takeSlot(admin))) throw new GeocodeBusyError();
  }

  // 4. In-process throttle
  const wait = lastCallAt + SLOT_MS - now();
  if (wait > 0) await sleep(wait);
  lastCallAt = now();

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`;
  const res = await doFetch(url, {
    headers: { "User-Agent": userAgent, "Accept-Language": "en" },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
  const body: unknown = await res.json();
  const first = Array.isArray(body) ? (body[0] as Record<string, unknown> | undefined) : undefined;
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const displayName = typeof first.display_name === "string" ? first.display_name : query.trim();
  const tz = zoneFor(lat, lon);

  try {
    await admin
      .from("lab_geocode_cache")
      .upsert({ query: key, lat, lon, display_name: displayName, tz }, { onConflict: "query" });
  } catch {
    // ignore cache write failures
  }
  return { lat, lon, displayName, tz };
}

async function takeSlot(admin: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("lab_take_slot", { p_key: "nominatim", p_interval_ms: SLOT_MS });
    if (error) return true; // RPC unavailable: proceed (see header)
    return data === true;
  } catch {
    return true;
  }
}
