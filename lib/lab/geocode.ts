// Server-only by convention (the `server-only` package is not installed).
// Place -> candidate coordinates + IANA zone, via Nominatim with a Supabase cache.
//
// Nominatim's policy allows ~1 request/second and requires an identifying
// User-Agent. We take a cross-instance slot with the lab_take_slot() RPC and
// also throttle inside the process. If the RPC errors (e.g. migration 016 not
// run yet) we proceed to Nominatim anyway rather than fail the visitor; the
// in-process throttle still applies. Cache read/write failures never break a lookup.
//
// Visitors mostly type Spanish names ("Londres", "Nueva York"). Nominatim matches
// OSM's name:* tags in every language, so matching works as is; Accept-Language
// only picks the language of the names it returns, so we ask for Spanish first.
// Ambiguous names ("Santiago", "Córdoba") return several candidates for the
// visitor to choose from, instead of silently taking the first.

import type { SupabaseClient } from "@supabase/supabase-js";
import { zoneFor } from "@/lib/astro";
import { createAdminClient } from "@/lib/supabase/admin";
import { distanceKm } from "./placeLabel";

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
const ACCEPT_LANGUAGE = "es,en;q=0.8";
/** Candidates returned to the visitor. */
const MAX_CANDIDATES = 5;
/** Ask for more than we show, because near-duplicates are merged away. */
const FETCH_LIMIT = 10;
/** Two results closer than this are the same place (city node + its boundary, etc.). */
const SAME_PLACE_KM = 30;
/** Bump when the cached shape or the query strategy changes. */
const CACHE_VERSION = "v2";
let lastCallAt = 0;

export function normaliseQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Drop results within SAME_PLACE_KM of an earlier (higher-ranked) one. */
export function dedupeCandidates(list: GeocodeResult[]): GeocodeResult[] {
  const kept: GeocodeResult[] = [];
  for (const c of list) {
    if (!kept.some((k) => distanceKm(k.lat, k.lon, c.lat, c.lon) < SAME_PLACE_KM)) kept.push(c);
  }
  return kept;
}

function parseResults(body: unknown, query: string, onlyPlaces: boolean): GeocodeResult[] {
  if (!Array.isArray(body)) return [];
  const out: GeocodeResult[] = [];
  for (const raw of body) {
    const r = raw as Record<string, unknown>;
    // The unfiltered pass can return streets and shops; keep only places and boundaries.
    if (onlyPlaces && typeof r.category === "string" && r.category !== "place" && r.category !== "boundary") continue;
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    let tz: string;
    try {
      tz = zoneFor(lat, lon);
    } catch {
      continue;
    }
    out.push({ lat, lon, displayName: typeof r.display_name === "string" ? r.display_name : query.trim(), tz });
  }
  return dedupeCandidates(out);
}

/**
 * Up to five distinct places for a query, best match first. Empty when nothing
 * matched. Tries settlements (cities, towns, villages) first, then falls back to
 * any place so a region or a rural birthplace is still found.
 */
export async function geocodeCandidates(query: string, deps: GeocodeDeps = {}): Promise<GeocodeResult[]> {
  const key = `${CACHE_VERSION}:${normaliseQuery(query)}`;
  if (key === `${CACHE_VERSION}:`) return [];
  // A missing service-role key (or any client construction failure) is a cache
  // failure: skip the cache and the slot RPC, still call Nominatim.
  let admin: SupabaseClient | null = deps.admin ?? null;
  if (!admin) {
    try {
      admin = createAdminClient();
    } catch {
      admin = null;
    }
  }
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? realSleep;
  const now = deps.now ?? Date.now;

  // 1. Cache
  try {
    if (!admin) throw new Error("no admin client");
    const { data } = await admin.from("lab_geocode_cache").select("candidates").eq("query", key).maybeSingle();
    const cached = data?.candidates;
    if (Array.isArray(cached) && cached.length > 0) {
      const valid = cached.filter(
        (c): c is GeocodeResult =>
          c && Number.isFinite(c.lat) && Number.isFinite(c.lon) && typeof c.displayName === "string" && typeof c.tz === "string",
      );
      if (valid.length > 0) return valid.slice(0, MAX_CANDIDATES);
    }
  } catch {
    // cache unavailable: fall through to a live lookup
  }

  // 2. Config
  const userAgent = process.env.NOMINATIM_USER_AGENT;
  if (!userAgent) throw new GeocodeConfigError("NOMINATIM_USER_AGENT is not set.");

  const search = async (settlementsOnly: boolean): Promise<GeocodeResult[]> => {
    // Cross-instance slot, one retry
    if (admin && !(await takeSlot(admin))) {
      await sleep(SLOT_MS);
      if (!(await takeSlot(admin))) throw new GeocodeBusyError();
    }
    // In-process throttle
    const wait = lastCallAt + SLOT_MS - now();
    if (wait > 0) await sleep(wait);
    lastCallAt = now();

    const params = new URLSearchParams({ format: "jsonv2", limit: String(FETCH_LIMIT), q: query.trim() });
    if (settlementsOnly) params.set("featuretype", "settlement");
    const res = await doFetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": userAgent, "Accept-Language": ACCEPT_LANGUAGE },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
    return parseResults(await res.json(), query, !settlementsOnly);
  };

  let found = await search(true);
  if (found.length === 0) found = await search(false);
  const candidates = found.slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) return [];

  try {
    if (!admin) throw new Error("no admin client");
    const first = candidates[0];
    await admin.from("lab_geocode_cache").upsert(
      { query: key, lat: first.lat, lon: first.lon, display_name: first.displayName, tz: first.tz, candidates },
      { onConflict: "query" },
    );
  } catch {
    // ignore cache write failures
  }
  return candidates;
}

/** The single best match, or null. Used where the visitor has no chance to choose. */
export async function geocode(query: string, deps: GeocodeDeps = {}): Promise<GeocodeResult | null> {
  return (await geocodeCandidates(query, deps))[0] ?? null;
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
