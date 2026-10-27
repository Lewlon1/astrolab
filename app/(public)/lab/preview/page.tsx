// /lab/preview: admin-only preview of the Lab profile with any card, birth date,
// time and place, in the real profile layout. For checking copy in place (Gabs's
// voice pass). Non-admins get a 404, so the page doesn't reveal it exists.
// Nothing here is stored; add-time and delete are hidden and clicks aren't tracked.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { loadLabOffers } from "@/lib/lab/offers";
import { PREVIEW_PLACES, parsePreviewParams, previewProfile } from "@/lib/lab/preview";
import { CARDS } from "@/content/lab/cards";
import { BTN_LIGHT, LABEL, cx } from "@/components/lab/classes";
import ProfileContent from "../profile/ProfileContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Profile preview · Astropsyche Lab" },
  robots: { index: false, follow: false },
};

const FIELD = "flex min-w-0 flex-col gap-1";
const CONTROL =
  "w-full min-w-0 rounded-[8px] border-[1.5px] border-cream2/30 bg-cream2/10 px-3 py-2 text-[15px] text-cream2 [color-scheme:dark] focus-visible:outline focus-visible:outline-2 focus-visible:outline-goldLight";

export default async function LabPreviewPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const { isAdmin } = await getAdminUser(supabase);
  if (!isAdmin) notFound();

  const params = parsePreviewParams(searchParams);
  const profile = previewProfile(params);
  const offers = await loadLabOffers(createAdminClient());

  return (
    <>
      <div className="bg-deepBrown text-cream2">
        <form method="get" className="mx-auto grid max-w-[720px] gap-4 px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-1">
            <p className={cx(LABEL, "m-0 text-goldLight")}>Admin preview · not a real profile</p>
            <p className="m-0 text-[14px] text-cream2/80">
              Pick a card and birth details to see the profile exactly as a visitor would. Nothing is saved or tracked. The
              address of this page after you press Show is the link to send.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={FIELD}>
              <span className={LABEL}>Card</span>
              <select name="card" defaultValue={params.card} className={CONTROL}>
                {CARDS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.numeral} · {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={FIELD}>
              <span className={LABEL}>Birthplace</span>
              <select name="place" defaultValue={params.place.key} className={CONTROL}>
                {PREVIEW_PLACES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={FIELD}>
              <span className={LABEL}>Date of birth</span>
              <input type="date" name="date" defaultValue={params.date} min="1900-01-01" className={CONTROL} />
            </label>
            <label className={FIELD}>
              <span className={LABEL}>Birth time (clear it for no time)</span>
              <input type="time" name="time" defaultValue={params.time ?? ""} className={CONTROL} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="inline-flex items-center gap-2 text-[14px]">
              <input type="checkbox" name="banner" value="1" defaultChecked={params.banner} className="h-4 w-4" />
              Show the new-visitor banner
            </label>
            <button type="submit" className={cx(BTN_LIGHT, "border-gold2 bg-gold2 text-deepBrown hover:bg-cream2")}>
              Show
            </button>
          </div>
          <p className="m-0 text-[13px] text-cream2/70">
            Try: no birth time · a sign-change birthday such as 21 June 1990 · every card at least once.
          </p>
        </form>
      </div>
      <ProfileContent profile={profile} offers={offers} unverified={params.banner} mailFailed={false} preview />
    </>
  );
}
