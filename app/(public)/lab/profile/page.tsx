import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLeadEvent } from "@/lib/lab/events";
import { buildProfileView } from "@/lib/lab/profileView";
import { seasonsForChart, serializeSeasons, type SerializedSeason } from "@/lib/lab/nextTransit";
import type { LabProfileRow } from "@/lib/lab/types";
import { CARDS } from "@/content/lab/cards";
import { BOOKING_CTA, PROFILE, PROFILE_EXTRA, STANCE } from "@/content/lab/ui";
import AddBirthTime from "@/components/lab/AddBirthTime";
import BookingCta from "@/components/lab/BookingCta";
import CardFace from "@/components/lab/CardFace";
import DeleteProfile from "@/components/lab/DeleteProfile";
import LabNote from "@/components/lab/LabNote";
import TransitTracker from "@/components/lab/TransitTracker";
import { EYEBROW, FOCUS, cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${PROFILE.title} · Astropsyche Lab` },
  robots: { index: false },
};

type Admin = ReturnType<typeof createAdminClient>;

const H2 = "m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown";
const SECTION = "mt-12";

async function loadLive(admin: Admin, userId: string): Promise<LabProfileRow | null> {
  const res = await admin
    .from("lab_profiles")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (res.error) throw new Error(`profile lookup failed (code ${res.error.code})`);
  return (res.data as LabProfileRow | null) ?? null;
}

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

/** Next 12 months of transit seasons, or undefined (tracker hidden) if the stored chart can't be read. */
function transitSeasons(profile: LabProfileRow): SerializedSeason[] | undefined {
  try {
    if (!profile.positions?.version) return undefined;
    return serializeSeasons(seasonsForChart(profile.positions));
  } catch (err) {
    console.error("[lab] transit computation failed:", err instanceof Error ? err.name : "error");
    return undefined;
  }
}

export default async function LabProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/lab");

  const admin = createAdminClient();
  let profile = await loadLive(admin, user.id);

  // Fallback: link an unclaimed profile by (lower-cased) email, then reload.
  if (!profile && user.email) {
    const link = await admin
      .from("lab_profiles")
      .update({ user_id: user.id })
      .eq("email", user.email.toLowerCase())
      .is("user_id", null)
      .is("deleted_at", null);
    if (link.error) console.error("[lab] profile link failed, code", link.error.code);
    profile = await loadLive(admin, user.id);
  }
  if (!profile) redirect("/lab");

  await recordOpened(admin, profile);

  const view = buildProfileView(profile);
  const card = CARDS.find((c) => c.name === view.header.card) ?? null;
  const showHouse = view.hasTime;
  const seasons = transitSeasons(profile);

  return (
    <div className="bg-cream2 text-deepBrown">
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-10 text-[16px] leading-[1.6] sm:px-6">
        <header>
          <p className={EYEBROW}>{PROFILE.sections.card}</p>
          <h1 className="mb-0 mt-2 font-fraunces text-[clamp(30px,6vw,40px)] font-medium leading-tight !text-deepBrown">
            {PROFILE.title}
          </h1>
          <div className="mt-6 grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-8">
            <div className={styles.staticCard} role="img" aria-label={PROFILE_EXTRA.cardAlt(view.header.card)}>
              {card ? (
                <CardFace card={card} flat ariaHidden />
              ) : (
                <div className={`${styles.face} ${styles.front} ${styles.flat}`}>
                  <span className={styles.name}>{view.header.card}</span>
                </div>
              )}
            </div>
            <dl className="m-0 grid gap-3">
              <div>
                <dt className={EYEBROW}>{PROFILE_EXTRA.sunLabel}</dt>
                <dd className="m-0 font-fraunces text-[22px]">{view.header.sun}</dd>
              </div>
              <div>
                <dt className={EYEBROW}>{PROFILE_EXTRA.moonLabel}</dt>
                <dd className="m-0 font-fraunces text-[22px]">{view.header.moon}</dd>
              </div>
              <div>
                <dt className={EYEBROW}>{PROFILE_EXTRA.risingLabel}</dt>
                <dd className="m-0 font-fraunces text-[22px]">
                  {view.header.rising ?? <span className="text-[16px] text-midBrown">{PROFILE.risingLocked}</span>}
                </dd>
              </div>
            </dl>
          </div>
          {!view.hasTime && <AddBirthTime />}
        </header>

        <section className={SECTION} aria-labelledby="lab-placements">
          <h2 id="lab-placements" className={H2}>
            {PROFILE.sections.placements}
          </h2>
          <p className="mb-0 mt-2 text-midBrown">{PROFILE_EXTRA.placementsIntro}</p>
          <div className="mt-6 grid gap-6">
            {view.coreNotes.map((n) => (
              <div key={n.key}>
                <LabNote title={n.title} astro={n.astro} psych={n.psych} test={n.test} headingId={`lab-note-${n.key}`} />
                {n.note && <p className="mb-0 mt-2 text-[14px] text-midBrown">{n.note}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className={SECTION} aria-labelledby="lab-chart">
          <h2 id="lab-chart" className={H2}>
            {PROFILE.sections.chart}
          </h2>
          <p className="mb-0 mt-2 text-midBrown">{PROFILE_EXTRA.tableIntro}</p>
          <div className="mt-5 overflow-x-auto rounded-[14px] border-[1.5px] border-deepBrown">
            <table className="w-full border-collapse text-left text-[15px]">
              <caption className="sr-only">{PROFILE_EXTRA.tableCaption}</caption>
              <thead className="bg-sagePale">
                <tr>
                  <th scope="col" className="px-4 py-3 font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">
                    {PROFILE_EXTRA.colPlanet}
                  </th>
                  <th scope="col" className="px-4 py-3 font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">
                    {PROFILE_EXTRA.colSign}
                  </th>
                  <th scope="col" className="px-4 py-3 font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">
                    {PROFILE_EXTRA.colDegree}
                  </th>
                  {showHouse && (
                    <th scope="col" className="px-4 py-3 font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">
                      {PROFILE_EXTRA.colHouse}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {view.positions.map((p) => (
                  <tr key={p.body} className="border-t border-cardBorder/60 align-top">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {p.title}
                      {p.keyword && <span className="mt-1 block text-[13px] font-normal text-midBrown">{p.keyword}</span>}
                    </th>
                    <td className="px-4 py-3">{p.sign}</td>
                    <td className="px-4 py-3">
                      {p.degree === null ? (
                        <span className="text-midBrown">{PROFILE_EXTRA.degreeUnknown}</span>
                      ) : (
                        PROFILE_EXTRA.degreeUnit(p.degree)
                      )}
                    </td>
                    {showHouse && <td className="px-4 py-3">{p.house ?? ""}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TransitTracker seasons={seasons} />

        <section className={cx(SECTION, "rounded-[14px] border-[1.5px] border-deepBrown bg-sagePale p-6")} aria-labelledby="lab-booking">
          <h2 id="lab-booking" className={H2}>
            {BOOKING_CTA.title}
          </h2>
          <p className="mb-5 mt-2">{BOOKING_CTA.body}</p>
          <BookingCta />
        </section>

        <p className="mb-0 mt-10 text-[14px] text-midBrown">{STANCE}</p>

        <footer className="mt-12 border-t border-cardBorder pt-8" aria-labelledby="lab-settings">
          <h2 id="lab-settings" className="sr-only">
            {PROFILE.sections.settings}
          </h2>
          <div className="grid gap-5">
            <DeleteProfile />
            <p className="m-0 text-[14px]">
              <Link href="/privacy#lab" className={cx("text-midBrown underline underline-offset-4", FOCUS, "focus-visible:outline-coral2")}>
                {PROFILE_EXTRA.privacyLink}
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
