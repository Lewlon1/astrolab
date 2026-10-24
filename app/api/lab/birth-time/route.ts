// POST /api/lab/birth-time: add or change the birth time and recompute the stored chart.
import { NextResponse } from "next/server";
import { computeChart } from "@/lib/astro";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toStoredChart } from "@/lib/lab/storedChart";
import { badRequest, readJson } from "@/lib/lab/routeHelpers";
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
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return NextResponse.json({ error: API.unauthorized }, { status: 401 });

    const admin = createAdminClient();
    const found = await admin
      .from("lab_profiles")
      .select("id, birth_date, lat, lon, tz")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (found.error) throw new Error(`profile lookup failed (code ${found.error.code})`);
    if (!found.data) return NextResponse.json({ error: API.profileNotFound }, { status: 404 });
    const p = found.data as Pick<LabProfileRow, "id" | "birth_date" | "lat" | "lon" | "tz">;

    const chart = computeChart({ dateISO: p.birth_date, timeHHMM: hhmm, lat: p.lat, lon: p.lon, zone: p.tz });
    const upd = await admin
      .from("lab_profiles")
      .update({
        birth_time: hhmm,
        birth_utc: chart.birthUtc.toISOString(),
        positions: toStoredChart(chart),
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (upd.error) throw new Error(`profile update failed (code ${upd.error.code})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lab] birth-time failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
