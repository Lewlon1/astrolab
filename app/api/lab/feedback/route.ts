// POST /api/lab/feedback: thumbs up/down on an instant reading. Responds 204.
// Anonymous by design (the reading comes before the email gate): the row is keyed
// by the client's draw id and linked to a lab profile later, at the gate.
// Stores no birth data beyond the signs the reading already showed.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, feedbackLimiter } from "@/lib/lab/rateLimit";
import { badRequest, readJson } from "@/lib/lab/routeHelpers";
import { validateFeedback } from "@/lib/lab/validate";
import { signChip } from "@/content/lab/reading";
import { API, VALIDATION } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!feedbackLimiter.allow(clientIp(request.headers))) {
    return NextResponse.json({ error: VALIDATION.rateLimited }, { status: 429 });
  }
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const v = validateFeedback(body);
  if (!v.ok) return NextResponse.json({ field: v.field, error: v.message }, { status: 400 });
  const f = v.value;

  try {
    const admin = createAdminClient();
    // One vote per reading; a changed vote overwrites it. lab_profile_id is not
    // in the payload, so a later vote never unlinks a row the gate already linked.
    const { error } = await admin.from("lab_reading_feedback").upsert(
      {
        draw_id: f.drawId,
        vote: f.vote,
        card: f.card,
        sun_sign: signChip(f.sun),
        moon_sign: signChip(f.moon),
        relation: f.relation,
        has_time: f.hasTime,
        src: f.src,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "draw_id" },
    );
    if (error) throw new Error(`feedback upsert failed (code ${error.code})`);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[lab] feedback failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
