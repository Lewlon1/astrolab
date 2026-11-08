// The Lab report: an optional signed quote, then a table of specimen rows (card, Sun,
// Moon) and the two lenses. "Put it into practice" is not a table row: it renders as a
// PracticeCallout, right under the table when `test` is given, or wherever the caller
// places it. Reused on the profile page. Server-safe (no hooks).
import { LAB_NOTE_LABEL, LAYER_LABELS } from "@/content/lab/reading";
import { cx } from "./classes";
import PracticeCallout from "./PracticeCallout";

export type SpecimenRow = { label: string; value: string };

export type LabNoteProps = {
  title: string;
  astro: string;
  psych: string;
  /** When given, the practice callout follows the table. Omit it to place the callout yourself. */
  test?: string;
  /** Rows above the lenses, e.g. Card / Sun / Moon. */
  specimen?: readonly SpecimenRow[];
  /** A signed comment at the top of the report. */
  quote?: { text: string; by: string };
  /** Small label in the header; defaults to "A Lab note". */
  label?: string;
  /** Heading id for aria-labelledby; must be unique on the page. */
  headingId?: string;
  className?: string;
};

const DT = "font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown pt-[3px]";
const ROW = "grid grid-cols-1 gap-1.5 border-t border-cardBorder/60 px-[18px] py-4 first:border-t-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4";
const SPECIMEN_ROW = "grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-cardBorder/60 px-[18px] py-2.5 first:border-t-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4";

export default function LabNote({
  title,
  astro,
  psych,
  test,
  specimen,
  quote,
  label = LAB_NOTE_LABEL,
  headingId = "lab-note-title",
  className,
}: LabNoteProps) {
  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <article aria-labelledby={headingId} className="overflow-hidden rounded-[14px] border-[1.5px] border-deepBrown bg-cream2">
        <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-[1.5px] border-deepBrown bg-sagePale px-[18px] py-[14px]">
          <h3 id={headingId} className="m-0 font-fraunces text-[19px] font-medium leading-tight !text-deepBrown">
            {title}
          </h3>
          <small className="font-dm-mono text-[11px] font-medium uppercase tracking-[0.14em] text-midBrown">{label}</small>
        </header>
        {quote && (
          <figure className="m-0 border-b-[1.5px] border-deepBrown px-[18px] py-5">
            <blockquote className="m-0 font-heading text-[clamp(20px,4.5vw,24px)] italic leading-[1.35] text-coral2">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-right font-caveat text-[22px] leading-none text-deepBrown">{quote.by}</figcaption>
          </figure>
        )}
        {specimen && specimen.length > 0 && (
          <dl className="m-0 border-b border-cardBorder/60">
            {specimen.map((row) => (
              <div key={row.label} className={SPECIMEN_ROW}>
                <dt className={DT}>{row.label}</dt>
                <dd className="m-0 min-w-0 font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <dl className="m-0">
          <div className={ROW}>
            <dt className={DT}>{LAYER_LABELS.astro}</dt>
            <dd className="m-0 min-w-0">{astro}</dd>
          </div>
          <div className={ROW}>
            <dt className={DT}>{LAYER_LABELS.psych}</dt>
            <dd className="m-0 min-w-0">{psych}</dd>
          </div>
        </dl>
      </article>
      {test && <PracticeCallout text={test} />}
    </div>
  );
}
