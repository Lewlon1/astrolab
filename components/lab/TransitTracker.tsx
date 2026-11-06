// "Your next two seasons" on the profile: a minimal timeline of transit themes,
// each with its date window and one line. Seasons arrive pre-selected and
// serialized (dates as ISO strings). Server-safe (no hooks).
import type { SerializedSeason } from "@/lib/lab/nextTransit";
import { transitCopy, transitTheme } from "@/content/lab/transits";
import { PROFILE, PROFILE_FLOW } from "@/content/lab/ui";
import { EYEBROW, cx } from "./classes";

export type TransitTrackerProps = {
  /** The upcoming seasons, in order. Undefined renders nothing; an empty list shows the empty state. */
  seasons?: readonly SerializedSeason[];
  /** Rendered under the timeline: the link onwards to a session. */
  children?: React.ReactNode;
};

const H2 = "m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown";

// UTC on both sides so server and client render the same day.
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmt = (iso: string) => DATE_FMT.format(new Date(iso));

/** True when the season has started by `now`. */
export const isUnderway = (season: Pick<SerializedSeason, "start">, now: number = Date.now()) =>
  new Date(season.start).getTime() <= now;

export default function TransitTracker({ seasons, children }: TransitTrackerProps) {
  if (!seasons) return null;

  return (
    <section className="mt-14" aria-labelledby="lab-transits">
      <p className={EYEBROW}>{PROFILE_FLOW.upcomingLabel}</p>
      <h2 id="lab-transits" className={cx(H2, "mt-2")}>
        {PROFILE_FLOW.upcomingTitle}
      </h2>
      <p className="mb-0 mt-2 text-midBrown">{PROFILE_FLOW.upcomingLine}</p>

      {seasons.length === 0 ? (
        <p className="mb-0 mt-6">{PROFILE.transitNone}</p>
      ) : (
        <ol className="m-0 mt-6 list-none space-y-0 border-l-[1.5px] border-deepBrown p-0">
          {seasons.map((s) => (
            <li key={`${s.planet}-${s.aspect}-${s.point}-${s.peak}`} className="relative pb-6 pl-6 last:pb-0">
              <span aria-hidden="true" className="absolute -left-[7px] top-[7px] h-3 w-3 rounded-full bg-coral2" />
              <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[14px] text-midBrown">
                <span>
                  <time dateTime={s.start}>{fmt(s.start)}</time> – <time dateTime={s.end}>{fmt(s.end)}</time>
                </span>
                {isUnderway(s) && (
                  <span className="rounded-full bg-deepBrown px-2 py-[1px] font-dm-mono text-[11px] uppercase tracking-[0.12em] text-cream2">
                    {PROFILE_FLOW.now}
                  </span>
                )}
              </p>
              <h3 className="mb-0 mt-1 font-fraunces text-[20px] font-medium leading-snug !text-deepBrown">
                {transitTheme(s.planet, s.point)}
              </h3>
              <p className="mb-0 mt-1 text-[15px]">{transitCopy(s.planet, s.aspect, s.point).headline}</p>
            </li>
          ))}
        </ol>
      )}

      {children}
    </section>
  );
}
