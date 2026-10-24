// Server-only by convention. Shared helpers for the /api/lab routes.
import { NextResponse } from "next/server";
import { API, ERRORS, VALIDATION } from "@/content/lab/ui";
import { GeocodeBusyError, GeocodeConfigError, geocode, type GeocodeResult } from "./geocode";

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export const badRequest = () => NextResponse.json({ error: API.badRequest }, { status: 400 });

/** Geocode and map failures to responses. Logs only the error name. */
export async function geocodeOrResponse(
  place: string
): Promise<{ ok: true; geo: GeocodeResult } | { ok: false; res: NextResponse }> {
  try {
    const geo = await geocode(place);
    if (!geo) {
      return { ok: false, res: NextResponse.json({ field: "place", error: ERRORS.placeNotFound }, { status: 404 }) };
    }
    return { ok: true, geo };
  } catch (err) {
    if (err instanceof GeocodeBusyError) {
      return { ok: false, res: NextResponse.json({ error: VALIDATION.geocodeBusy }, { status: 503 }) };
    }
    if (err instanceof GeocodeConfigError) {
      console.error("[lab] geocode config error:", err.name);
      return { ok: false, res: NextResponse.json({ error: API.serverError }, { status: 500 }) };
    }
    console.error("[lab] geocode failed:", err instanceof Error ? err.name : "unknown");
    return { ok: false, res: NextResponse.json({ error: API.geocodeUnavailable }, { status: 502 }) };
  }
}
