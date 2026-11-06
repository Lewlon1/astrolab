// POST /api/lab/delete: soft-delete the viewer's profile (signed-in or session cookie) and forget them in MailerLite.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgetSubscriber } from "@/lib/lab/mailerlite";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/lab/session";
import { readLabCookie, resolveLabViewer } from "@/lib/lab/viewer";
import { API } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const viewer = await resolveLabViewer<{ id: string; email: string }>({
      supabase,
      admin,
      cookieValue: await readLabCookie(),
      columns: "id, email",
    });
    if (!viewer) return NextResponse.json({ error: API.unauthorized }, { status: 401 });
    const profile = viewer.row;

    // MailerLite first: forgetting needs the real address, which is scrubbed below.
    const mailerlite = await forgetSubscriber(profile.email);

    // Soft-delete and scrub every personal column to a tombstone in one update.
    // NOT NULL columns get inert placeholders. The partial unique index on
    // lower(email) where deleted_at is null ignores the tombstone row.
    const now = new Date().toISOString();
    const upd = await admin
      .from("lab_profiles")
      .update({
        deleted_at: now,
        email: `deleted+${profile.id}@invalid`,
        birth_date: "1900-01-01",
        birth_time: null,
        birth_place_text: "",
        lat: 0,
        lon: 0,
        tz: "UTC",
        birth_utc: "1970-01-01T00:00:00Z",
        card_drawn: "",
        positions: {},
        src: null,
        next_transit: null,
        transit_peak_date: null,
        updated_at: now,
      })
      .eq("id", profile.id);
    if (upd.error) throw new Error(`profile delete failed (code ${upd.error.code})`);

    if (viewer.via === "session") await supabase.auth.signOut();
    const res = NextResponse.json({ ok: true, mailerlite });
    res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
    return res;
  } catch (err) {
    console.error("[lab] delete failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
