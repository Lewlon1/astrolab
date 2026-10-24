// The three-layer Lab note: what astrology says, what psychology studies, and a
// test for this month. Reused on the profile page. Server-safe (no hooks).
import { LAB_NOTE_LABEL, LAYER_LABELS } from "@/content/lab/reading";
import { cx } from "./classes";

export type LabNoteProps = {
  title: string;
  astro: string;
  psych: string;
  test: string;
  /** Heading id for aria-labelledby; must be unique on the page. */
  headingId?: string;
  className?: string;
};

const DT = "font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown pt-[3px]";
const ROW = "grid grid-cols-1 gap-1.5 border-t border-cardBorder/60 px-[18px] py-4 first:border-t-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4";

export default function LabNote({ title, astro, psych, test, headingId = "lab-note-title", className }: LabNoteProps) {
  return (
    <article
      aria-labelledby={headingId}
      className={cx("overflow-hidden rounded-[14px] border-[1.5px] border-deepBrown bg-cream2", className)}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-[1.5px] border-deepBrown bg-sagePale px-[18px] py-[14px]">
        <h3 id={headingId} className="m-0 font-fraunces text-[19px] font-medium leading-tight !text-deepBrown">
          {title}
        </h3>
        <small className="font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">
          {LAB_NOTE_LABEL}
        </small>
      </header>
      <dl className="m-0">
        <div className={ROW}>
          <dt className={DT}>{LAYER_LABELS.astro}</dt>
          <dd className="m-0 min-w-0">{astro}</dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>{LAYER_LABELS.psych}</dt>
          <dd className="m-0 min-w-0">{psych}</dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>{LAYER_LABELS.test}</dt>
          <dd className="m-0 min-w-0 font-heading text-[20px] italic leading-[1.35]">{test}</dd>
        </div>
      </dl>
    </article>
  );
}
