// POST /api/lab/event: record a post-email funnel event for the viewer (signed-in or session cookie). Responds 204.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLeadEvent } from "@/lib/lab/events";
import { badRequest, readJson } from "@/lib/lab/routeHelpers";
import { readLabCookie, resolveLabViewer } from "@/lib/lab/viewer";
import { LAB_OFFER_SLUGS } from "@/lib/lab/offers";
import type { StoredChart } from "@/lib/lab/types";
import { API } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

/** Where on the profile a booking button sits. */
const PLACEMENTS: readonly string[] = ["chart", "transits", "offers"];

/** A known value, else null (unknown values are dropped, the event is still recorded). */
const oneOf = (v: unknown, allowed: readonly string[]) => (typeof v === "string" && allowed.includes(v) ? v : null);

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (b.type !== "lab_booking_clicked") return badRequest();
  const service = oneOf(b.service, LAB_OFFER_SLUGS);
  const placement = oneOf(b.placement, PLACEMENTS);

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const viewer = await resolveLabViewer<{ id: string; email: string; card_drawn: string; src: string | null; positions: StoredChart }>({
      supabase,
      admin,
      cookieValue: await readLabCookie(),
      columns: "id, email, card_drawn, src, positions",
    });
    if (!viewer) return NextResponse.json({ error: API.unauthorized }, { status: 401 });
    const p = viewer.row;

    await recordLeadEvent(admin, {
      email: p.email,
      type: "lab_booking_clicked",
      detail: { src: p.src, card: p.card_drawn, has_time: Boolean(p.positions?.hasTime), service, placement },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[lab] event failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
