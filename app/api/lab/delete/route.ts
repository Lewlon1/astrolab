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

    // birth_time is the only nullable birth column; positions is replaced with {}.
    // NOT NULL columns keep their values; deleted_at hides the row.
    const upd = await admin
      .from("lab_profiles")
      .update({
        deleted_at: new Date().toISOString(),
        birth_time: null,
        positions: {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (upd.error) throw new Error(`profile delete failed (code ${upd.error.code})`);

    const mailerlite = await forgetSubscriber(profile.email);
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true, mailerlite });
  } catch (err) {
    console.error("[lab] delete failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: API.serverError }, { status: 500 });
  }
}
