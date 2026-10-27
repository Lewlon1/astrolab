// POST /api/lab/compute: instant reading from card + birth data. No storage. Never logs the body.
import { NextResponse } from "next/server";
import { computeChart } from "@/lib/astro";
import { composeReading } from "@/lib/lab/reading";
import { clientIp, computeLimiter } from "@/lib/lab/rateLimit";
import { validateCompute } from "@/lib/lab/validate";
import { badRequest, publicPlace, readJson, resolvePlaceOrChoices } from "@/lib/lab/routeHelpers";
import { API, VALIDATION } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!computeLimiter.allow(clientIp(request.headers))) {
    return NextResponse.json({ error: VALIDATION.rateLimited }, { status: 429 });
  }
  const body = await readJson(request);
  if (body === undefined) return badRequest();

  const v = validateCompute(body);
  if (!v.ok) return NextResponse.json({ field: v.field, error: v.message }, { status: 400 });
  const input = v.value;

  const g = await resolvePlaceOrChoices(input.place, input.geo);
  if (g.ok === false) return g.res;
  // Ambiguous name ("Santiago"): let the visitor pick before we compute anything.
  if (g.ok === "choose") return NextResponse.json({ choices: g.choices.map(publicPlace) });
  const { geo } = g;

  try {
    const chart = computeChart({
      dateISO: input.date,
      timeHHMM: input.time,
      lat: geo.lat,
      lon: geo.lon,
      zone: geo.tz,
    });
    const reading = composeReading(input.card, chart);
    return NextResponse.json({
      reading,
      chart: {
        hasTime: chart.hasTime,
        approximateZone: chart.approximateZone,
        positions: chart.positions,
        ambiguous: chart.ambiguous,
        rising: chart.rising,
      },
      place: publicPlace(geo),
      attribution: API.attribution,
    });
  } catch (err) {
    console.error("[lab] compute failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
