// POST /api/lab/delete: soft-delete the signed-in user's profile and forget them in MailerLite.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgetSubscriber } from "@/lib/lab/mailerlite";
import { API } from "@/content/lab/ui";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return NextResponse.json({ error: API.unauthorized }, { status: 401 });

    const admin = createAdminClient();
    const found = await admin
      .from("lab_profiles")
      .select("id, email")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (found.error) throw new Error(`profile lookup failed (code ${found.error.code})`);
    if (!found.data) return NextResponse.json({ error: API.profileNotFound }, { status: 404 });
    const profile = found.data as { id: string; email: string };

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

    await supabase.auth.signOut();
    return NextResponse.json({ ok: true, mailerlite });
  } catch (err) {
    console.error("[lab] delete failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
