// Transit tracker on the profile page: the next significant season in full
// (headline, peak, every exact pass, then the three-layer note), followed by the
// next four. Seasons are computed server-side; dates arrive as ISO strings.
// Server-safe (no hooks).
import type { SerializedSeason } from "@/lib/lab/nextTransit";
import { transitCopy } from "@/content/lab/transits";
import { PROFILE, TRANSIT_UI } from "@/content/lab/ui";
import LabNote from "./LabNote";
import { EYEBROW } from "./classes";

export type TransitTrackerProps = {
  /** Sorted by significance. Undefined renders nothing; an empty list shows the empty state. */
  seasons?: readonly SerializedSeason[];
};

const H2 = "m-0 font-fraunces text-[26px] font-medium leading-tight !text-deepBrown";
const FOLLOWING = 4;

// UTC on both sides so server and client render the same day.
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (iso: string) => DATE_FMT.format(new Date(iso));

export default function TransitTracker({ seasons }: TransitTrackerProps) {
  if (!seasons) return null;
  const [next, ...rest] = seasons;
  const following = rest.slice(0, FOLLOWING);

  return (
    <section className="mt-12" aria-labelledby="lab-transits">
      <h2 id="lab-transits" className={H2}>
        {TRANSIT_UI.heading}
      </h2>
      <p className="mb-0 mt-2 text-midBrown">{PROFILE.transitIntro}</p>

      {!next ? (
        <p className="mb-0 mt-6">{PROFILE.transitNone}</p>
      ) : (
        <NextSeason season={next} />
      )}

      {following.length > 0 && (
        <div className="mt-8">
          <h3 className={EYEBROW}>{TRANSIT_UI.alsoComing}</h3>
          <ul className="m-0 mt-3 list-none divide-y divide-cardBorder/60 rounded-[14px] border-[1.5px] border-deepBrown p-0">
            {following.map((s) => (
              <li
                key={`${s.planet}-${s.aspect}-${s.point}-${s.peak}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-[18px] py-3"
              >
                <span className="font-fraunces text-[18px]">{transitCopy(s.planet, s.aspect, s.point).headline}</span>
                <span className="text-[14px] text-midBrown">
                  {TRANSIT_UI.peaks} <time dateTime={s.peak}>{fmt(s.peak)}</time>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function NextSeason({ season }: { season: SerializedSeason }) {
  const copy = transitCopy(season.planet, season.aspect, season.point);
  const several = season.exactDates.length > 1;
  return (
    <div className="mt-6">
      <p className={EYEBROW}>{PROFILE.sections.transit}</p>
      <p className="mb-0 mt-2 font-fraunces text-[24px] font-medium leading-tight">{copy.headline}</p>
      <p className="mb-0 mt-1">
        {TRANSIT_UI.peaks} <time dateTime={season.peak}>{fmt(season.peak)}</time>
      </p>
      {several && (
        <div className="mt-3 text-[15px]">
          <p className="m-0 text-midBrown">{TRANSIT_UI.passesNote}</p>
          <p className="m-0 mt-1">
            {TRANSIT_UI.exactOn}{" "}
            {season.exactDates.map((d, i) => (
              <span key={d}>
                {i > 0 && ", "}
                <time dateTime={d}>{fmt(d)}</time>
              </span>
            ))}
          </p>
        </div>
      )}
      <LabNote
        className="mt-5"
        title={copy.headline}
        astro={copy.astro}
        psych={copy.psych}
        test={copy.test}
        headingId="lab-note-transit"
      />
    </div>
  );
}
