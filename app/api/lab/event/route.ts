// POST /api/lab/event: record a post-email funnel event for the signed-in user. Responds 204.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLeadEvent } from "@/lib/lab/events";
import { badRequest, readJson } from "@/lib/lab/routeHelpers";
import type { StoredChart } from "@/lib/lab/types";
import { API } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return badRequest();
  const type = body && typeof body === "object" ? (body as Record<string, unknown>).type : undefined;
  if (type !== "lab_booking_clicked") return badRequest();

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return NextResponse.json({ error: API.unauthorized }, { status: 401 });

    const admin = createAdminClient();
    const found = await admin
      .from("lab_profiles")
      .select("email, card_drawn, src, positions")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (found.error) throw new Error(`profile lookup failed (code ${found.error.code})`);
    if (!found.data) return NextResponse.json({ error: API.profileNotFound }, { status: 404 });
    const p = found.data as { email: string; card_drawn: string; src: string | null; positions: StoredChart };

    await recordLeadEvent(admin, {
      email: p.email,
      type: "lab_booking_clicked",
      detail: { src: p.src, card: p.card_drawn, has_time: Boolean(p.positions?.hasTime) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[lab] event failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
