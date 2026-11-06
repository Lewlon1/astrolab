import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLeadEvent } from "@/lib/lab/events";
import { readLabCookie, resolveLabViewer } from "@/lib/lab/viewer";
import { loadLabOffers } from "@/lib/lab/offers";
import type { LabProfileRow } from "@/lib/lab/types";
import { PROFILE } from "@/content/lab/ui";
import ProfileContent from "./ProfileContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${PROFILE.title} · Astropsyche Lab` },
  robots: { index: false },
};

type Admin = ReturnType<typeof createAdminClient>;

/** Record lab_profile_opened at most once per 24h per lead. Never throws. */
async function recordOpened(admin: Admin, profile: LabProfileRow): Promise<void> {
  try {
    if (!profile.lead_id) return;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = await admin
      .from("lead_events")
      .select("id")
      .eq("lead_id", profile.lead_id)
      .eq("type", "lab_profile_opened")
      .gte("created_at", since)
      .limit(1);
    if (recent.error) {
      console.error("[lab] opened-event lookup failed, code", recent.error.code);
      return;
    }
    if (recent.data && recent.data.length > 0) return;
    await recordLeadEvent(admin, {
      email: profile.email,
      type: "lab_profile_opened",
      detail: { src: profile.src, card: profile.card_drawn, has_time: profile.positions.hasTime },
    });
  } catch {
    console.error("[lab] recordOpened failed");
  }
}

export default async function LabProfilePage({ searchParams }: { searchParams: { mail?: string } }) {
  const supabase = await createClient();
  const admin = createAdminClient();
  // A signed-in user, or the signed cookie set when the profile was created (unverified email).
  const viewer = await resolveLabViewer<LabProfileRow>({
    supabase,
    admin,
    cookieValue: await readLabCookie(),
    columns: "*",
  });
  if (!viewer) redirect("/lab");
  const profile = viewer.row;
  const unverified = viewer.via === "cookie";

  await recordOpened(admin, profile);

  const offers = await loadLabOffers(admin);
  return (
    <ProfileContent profile={profile} offers={offers} unverified={unverified} mailFailed={searchParams.mail === "failed"} />
  );
}
