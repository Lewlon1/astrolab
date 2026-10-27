// Server-only by convention. Shared helpers for the /api/lab routes.
import { NextResponse } from "next/server";
import { zoneFor } from "@/lib/astro";
import { API, ERRORS, VALIDATION } from "@/content/lab/ui";
import { GeocodeBusyError, GeocodeConfigError, geocode, geocodeCandidates, type GeocodeResult } from "./geocode";
import { shortPlaceLabel } from "./placeLabel";
import type { ChosenGeo } from "./validate";

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export const badRequest = () => NextResponse.json({ error: API.badRequest }, { status: 400 });

const notFound = () => NextResponse.json({ field: "place", error: ERRORS.placeNotFound }, { status: 404 });

/** The shape the client keeps and sends back as `geo`, plus a short label to show. */
export const publicPlace = (g: GeocodeResult) => ({
  displayName: g.displayName,
  label: shortPlaceLabel(g.displayName),
  lat: g.lat,
  lon: g.lon,
  tz: g.tz,
});

/** A place the visitor already chose: coordinates are theirs, the zone is always derived here. */
function fromChosenGeo(chosen: ChosenGeo): GeocodeResult | null {
  try {
    return { ...chosen, tz: zoneFor(chosen.lat, chosen.lon) };
  } catch {
    return null;
  }
}

/** Map geocoder failures to responses. Logs only the error name. */
function geocodeFailure(err: unknown): NextResponse {
  if (err instanceof GeocodeBusyError) {
    return NextResponse.json({ error: VALIDATION.geocodeBusy }, { status: 503 });
  }
  if (err instanceof GeocodeConfigError) {
    console.error("[lab] geocode config error:", err.name);
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
  console.error("[lab] geocode failed:", err instanceof Error ? err.name : "unknown");
  return NextResponse.json({ error: API.geocodeUnavailable }, { status: 502 });
}

/**
 * Resolve the birth place for the gate: the place the visitor already saw on
 * their reading when the client sends it back (so the saved profile matches the
 * reading), otherwise the single best geocode match.
 */
export async function geocodeOrResponse(
  place: string,
  chosen: ChosenGeo | null = null,
): Promise<{ ok: true; geo: GeocodeResult } | { ok: false; res: NextResponse }> {
  if (chosen) {
    const geo = fromChosenGeo(chosen);
    if (geo) return { ok: true, geo };
  }
  try {
    const geo = await geocode(place);
    return geo ? { ok: true, geo } : { ok: false, res: notFound() };
  } catch (err) {
    return { ok: false, res: geocodeFailure(err) };
  }
}

/**
 * Resolve the birth place for the reading. `choices` is set when the name is
 * ambiguous and the visitor has not picked yet.
 */
export async function resolvePlaceOrChoices(
  place: string,
  chosen: ChosenGeo | null,
): Promise<{ ok: true; geo: GeocodeResult } | { ok: false; res: NextResponse } | { ok: "choose"; choices: GeocodeResult[] }> {
  if (chosen) {
    const geo = fromChosenGeo(chosen);
    if (geo) return { ok: true, geo };
  }
  try {
    const found = await geocodeCandidates(place);
    if (found.length === 0) return { ok: false, res: notFound() };
    if (found.length === 1) return { ok: true, geo: found[0] };
    return { ok: "choose", choices: found };
  } catch (err) {
    return { ok: false, res: geocodeFailure(err) };
  }
}
