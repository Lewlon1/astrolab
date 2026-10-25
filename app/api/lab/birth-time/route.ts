// POST /api/lab/birth-time: add or change the birth time and recompute the stored chart.
import { NextResponse } from "next/server";
import { computeChart } from "@/lib/astro";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLabFields, transitFieldsForMailerLite } from "@/lib/lab/mailerlite";
import { nextTransitFields, seasonsForChart, type NextTransitFields } from "@/lib/lab/nextTransit";
import { signFieldForMailerLite, toStoredChart } from "@/lib/lab/storedChart";
import { badRequest, readJson } from "@/lib/lab/routeHelpers";
import { readLabCookie, resolveLabViewer } from "@/lib/lab/viewer";
import type { LabProfileRow } from "@/lib/lab/types";
import { API, VALIDATION } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const time = body && typeof body === "object" ? (body as Record<string, unknown>).time : undefined;
  if (typeof time !== "string" || !TIME_RE.test(time.trim())) {
    return NextResponse.json({ field: "time", error: VALIDATION.timeInvalid }, { status: 400 });
  }
  const hhmm = time.trim();

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const viewer = await resolveLabViewer<Pick<LabProfileRow, "id" | "email" | "birth_date" | "lat" | "lon" | "tz">>({
      supabase,
      admin,
      cookieValue: await readLabCookie(),
      columns: "id, email, birth_date, lat, lon, tz",
    });
    if (!viewer) return NextResponse.json({ error: API.unauthorized }, { status: 401 });
    const p = viewer.row;

    const chart = computeChart({ dateISO: p.birth_date, timeHHMM: hhmm, lat: p.lat, lon: p.lon, zone: p.tz });
    const stored = toStoredChart(chart);
    // The time can change the Rising point and so the next transit. A failure here
    // must not lose the time change: keep going with null fields.
    let transit: NextTransitFields = { next_transit: null, transit_peak_date: null };
    try {
      transit = nextTransitFields(seasonsForChart(stored));
    } catch (err) {
      console.error("[lab] birth-time transit computation failed:", err instanceof Error ? err.name : "error");
    }
    const upd = await admin
      .from("lab_profiles")
      .update({
        birth_time: hhmm,
        birth_utc: chart.birthUtc.toISOString(),
        positions: stored,
        ...transit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (upd.error) throw new Error(`profile update failed (code ${upd.error.code})`);
    // Never throws; a MailerLite failure does not fail the request.
    // With a time the signs are settled, so replace any earlier "X or Y".
    await updateLabFields(p.email, {
      sun_sign: signFieldForMailerLite(stored, "Sun"),
      moon_sign: signFieldForMailerLite(stored, "Moon"),
      ...transitFieldsForMailerLite(transit),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lab] birth-time failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
