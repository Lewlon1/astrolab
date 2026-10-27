// The Lab profile itself: the card, the chart read through it, the experiment,
// the next two seasons and the ways to work with Gabs. Pure rendering from a
// stored row, so the page (and any preview) only has to resolve the viewer.
import Link from "next/link";
import { buildProfileView } from "@/lib/lab/profileView";
import { seasonsForChart, serializeSeasons, upcomingSeasons, type SerializedSeason } from "@/lib/lab/nextTransit";
import type { LabOffer } from "@/lib/lab/offers";
import type { LabProfileRow } from "@/lib/lab/types";
import { CARDS } from "@/content/lab/cards";
import { OFFERS_UI } from "@/content/lab/offers";
import { BOOKING_URL, PROFILE, PROFILE_EXTRA, PROFILE_FLOW, PROFILE_UNVERIFIED, STANCE } from "@/content/lab/ui";
import AddBirthTime from "@/components/lab/AddBirthTime";
import BookingCta from "@/components/lab/BookingCta";
import CardFace from "@/components/lab/CardFace";
import DeleteProfile from "@/components/lab/DeleteProfile";
import LabNote from "@/components/lab/LabNote";
import OfferLadder from "@/components/lab/OfferLadder";
import TransitTracker from "@/components/lab/TransitTracker";
import { EYEBROW, FOCUS, cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";

const H2 = "m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown";
const SECTION = "mt-14";
/** The small line that names the Lab layer a section shows. */
const LAYER = "font-dm-mono text-[12px] font-medium uppercase tracking-[0.14em] text-coral2 m-0";
const SUMMARY = cx(
  "cursor-pointer select-none font-dm-mono text-[12px] font-medium uppercase tracking-[0.12em] text-midBrown hover:text-coral2",
  FOCUS,
  "focus-visible:outline-coral2",
);

/** The next two transit seasons, or undefined (timeline hidden) if the stored chart can't be read. */
function transitSeasons(profile: LabProfileRow): SerializedSeason[] | undefined {
  try {
    if (!profile.positions?.version) return undefined;
    return serializeSeasons(upcomingSeasons(seasonsForChart(profile.positions)));
  } catch (err) {
    console.error("[lab] transit computation failed:", err instanceof Error ? err.name : "error");
    return undefined;
  }
}

type Props = {
  profile: LabProfileRow;
  offers: readonly LabOffer[];
  /** Viewing through the session cookie (email not yet verified). */
  unverified: boolean;
  /** The sign-in email could not be sent. */
  mailFailed: boolean;
  /** Admin preview: hide the controls that change a real profile (add time, delete). */
  preview?: boolean;
};

export default function ProfileContent({ profile, offers, unverified, mailFailed, preview = false }: Props) {
  const view = buildProfileView(profile);
  const card = CARDS.find((c) => c.name === view.header.card) ?? null;
  const showHouse = view.hasTime;
  const seasons = transitSeasons(profile);
  const primary: LabOffer | undefined = offers.find((o) => o.role === "primary");
  const primaryHref = primary?.href ?? BOOKING_URL;
  const primaryLabel = primary ? OFFERS_UI.book(primary.name, primary.priceLabel) : OFFERS_UI.book("a session", null);
  const lens = view.lens;

  return (
    <div className="bg-cream2 text-deepBrown">
      <div className="mx-auto max-w-[720px] px-4 pb-16 pt-10 text-[16px] leading-[1.6] sm:px-6">
        {unverified && (
          <aside role="status" className="mb-8 rounded-[14px] border-[1.5px] border-gold2 bg-sagePale p-4 text-[15px]">
            <p className="m-0 font-medium">{PROFILE_UNVERIFIED.title}</p>
            <p className="mb-0 mt-1 text-midBrown">
              {mailFailed ? PROFILE_UNVERIFIED.mailFailed : PROFILE_UNVERIFIED.body}
            </p>
          </aside>
        )}

        {/* Layer one: the card */}
        <header>
          <p className={LAYER}>{PROFILE_FLOW.layers.card}</p>
          <p className="mb-0 mt-2 max-w-[60ch] text-[15px] text-midBrown">{PROFILE_FLOW.cardLine}</p>
          <div className="mt-6 grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)] sm:gap-8">
            <div className={styles.staticCard} role="img" aria-label={PROFILE_EXTRA.cardAlt(view.header.card)}>
              {card ? (
                <CardFace card={card} flat ariaHidden />
              ) : (
                <div className={`${styles.face} ${styles.front} ${styles.flat}`}>
                  <span className={styles.name}>{view.header.card}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="m-0 font-fraunces text-[clamp(28px,6vw,40px)] font-medium leading-tight !text-deepBrown">
                {PROFILE_FLOW.heroTitle(view.header.card)}
              </h1>
              {lens && (
                <>
                  <p className={cx(EYEBROW, "mt-4")}>{PROFILE_FLOW.themeLabel}</p>
                  <p className="mb-0 mt-1 font-fraunces text-[20px]">{lens.theme.title}</p>
                  <p className="mb-0 mt-3">{lens.now}</p>
                </>
              )}
            </div>
          </div>
          {lens && (
            <p className="mb-0 mt-6 border-l-2 border-coral2 pl-4 font-heading text-[20px] italic leading-snug text-coral2">
              {lens.question}
            </p>
          )}
        </header>

        {/* Layer two: the chart, read through the card */}
        <section className={SECTION} aria-labelledby="lab-chart-lens">
          <p className={LAYER}>{PROFILE_FLOW.layers.chart}</p>
          <h2 id="lab-chart-lens" className={cx(H2, "mt-2")}>
            {lens ? PROFILE_FLOW.chartTitle(lens.theme.title) : PROFILE.sections.chart}
          </h2>
          <p className="mb-0 mt-2 text-midBrown">{PROFILE_FLOW.chartLine}</p>
          <div className="mt-6 grid gap-4">
            {view.bigThree.map((b) => (
              <article key={b.key} className="rounded-[14px] border-[1.5px] border-deepBrown p-5" aria-labelledby={`lab-big-${b.key}`}>
                <p className={EYEBROW}>{b.key}</p>
                <h3 id={`lab-big-${b.key}`} className="mb-0 mt-1 font-fraunces text-[22px] font-medium !text-deepBrown">
                  {b.signLabel}
                </h3>
                <p className="mb-0 mt-2 text-[15px] text-midBrown">{b.essence}</p>
                {b.lensLine && <p className="mb-0 mt-3">{b.lensLine}</p>}
                {b.note.note && <p className="mb-0 mt-2 text-[14px] text-midBrown">{b.note.note}</p>}
                <details className="mt-4">
                  <summary className={SUMMARY}>{PROFILE_FLOW.readNote}</summary>
                  <LabNote
                    className="mt-3"
                    title={b.note.title}
                    astro={b.note.astro}
                    psych={b.note.psych}
                    test={b.note.test}
                    headingId={`lab-note-${b.key}`}
                  />
                </details>
              </article>
            ))}
            {!view.hasTime && (
              <article className="rounded-[14px] border-[1.5px] border-dashed border-cardBorder p-5">
                <p className={EYEBROW}>{PROFILE_EXTRA.risingLabel}</p>
                <p className="mb-0 mt-1 text-midBrown">{PROFILE.risingLocked}</p>
                {!preview && <AddBirthTime />}
              </article>
            )}
          </div>
          {lens && (
            <div className="mt-8 rounded-[14px] bg-sagePale p-6">
              <p className="m-0 font-fraunces text-[20px] leading-snug">{lens.chartQuestion}</p>
              <BookingCta className="mt-5" href={primaryHref} label={primaryLabel} service={primary?.slug} placement="chart" track={!preview} />
            </div>
          )}
        </section>

        {/* Layer three: the test */}
        {lens && (
          <section className={SECTION} aria-labelledby="lab-experiment">
            <p className={LAYER}>{PROFILE_FLOW.layers.test}</p>
            <h2 id="lab-experiment" className={cx(H2, "mt-2")}>
              {PROFILE_FLOW.testTitle}
            </h2>
            <p className="mb-0 mt-2 text-midBrown">{PROFILE_FLOW.testLine}</p>
            <LabNote
              className="mt-5"
              title={lens.theme.title}
              astro={lens.theme.astro}
              psych={lens.theme.psych}
              test={lens.theme.test}
              headingId="lab-note-theme"
            />
            <p className="mb-0 mt-4 text-[15px] text-midBrown">{PROFILE_FLOW.testClose}</p>
          </section>
        )}

        <TransitTracker seasons={seasons}>
          {seasons && seasons.length > 0 && (
            <div className="mt-6">
              <p className="m-0">{PROFILE_FLOW.upcomingClose}</p>
              <BookingCta
                className="mt-4"
                href={primaryHref}
                label={primaryLabel}
                service={primary?.slug}
                placement="transits"
                track={!preview}
                variant="secondary"
              />
            </div>
          )}
        </TransitTracker>

        <OfferLadder offers={offers} card={view.header.card} preview={preview} />

        <section className={SECTION} aria-labelledby="lab-chart">
          <details>
            <summary className={SUMMARY}>
              <span id="lab-chart">{PROFILE_FLOW.fullChart}</span>
            </summary>
            <p className="mb-0 mt-3 text-midBrown">{PROFILE_EXTRA.tableIntro}</p>
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
          </details>
        </section>

        <p className="mb-0 mt-10 text-[14px] text-midBrown">{STANCE}</p>

        <footer className="mt-12 border-t border-cardBorder pt-8" aria-labelledby="lab-settings">
          <h2 id="lab-settings" className="sr-only">
            {PROFILE.sections.settings}
          </h2>
          <div className="grid gap-5">
            {!preview && <DeleteProfile />}
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
