// Renders the instant reading exactly as the compute route returns it (composeReading output).
import type { InstantReading } from "@/lib/lab/reading";
import { STANCE_LINE } from "@/content/lab/reading";
import { READING_NOTES } from "@/content/lab/ui";
import LabNote from "./LabNote";
import { HAND_NOTE, cx } from "./classes";

type Props = {
  reading: InstantReading;
  /** id for the headline, so the section can be aria-labelledby it. */
  headingId: string;
};

const UNCERTAIN = "m-0 max-w-[62ch] border-l-2 border-gold2 pl-3 text-[14px] text-midBrown";

export default function Reading({ reading, headingId }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        id={headingId}
        className="m-0 font-fraunces text-[clamp(28px,6vw,40px)] font-medium leading-[1.05] !text-deepBrown [text-wrap:balance]"
      >
        {reading.headline}
      </h2>

      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {reading.chips.map((chip, i) => (
          <li
            key={chip.label}
            className={cx(
              "inline-flex items-baseline gap-2 rounded-full px-[14px] py-2 text-[14px]",
              i === 0 ? "bg-deepBrown text-cream2" : "border border-cardBorder bg-sagePale text-deepBrown",
            )}
          >
            <span className="font-dm-mono text-[11px] uppercase tracking-[0.12em] opacity-80">{chip.label}</span>
            {chip.value}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 text-[17px] leading-[1.6]">
        {reading.paragraphs.map((p, i) => (
          <p
            key={i}
            className={cx(
              "m-0 max-w-[62ch]",
              p.kind === "open" && "font-heading text-[24px] italic leading-[1.35] text-coral2",
            )}
          >
            {p.text}
          </p>
        ))}
      </div>

      {reading.cuspNote && <p className={UNCERTAIN}>{reading.cuspNote}</p>}
      {reading.approximateZone && <p className={UNCERTAIN}>{READING_NOTES.approximateZone}</p>}

      <LabNote {...reading.labNote} headingId={`${headingId}-note`} />

      <p className={HAND_NOTE}>{STANCE_LINE}</p>
    </div>
  );
}
