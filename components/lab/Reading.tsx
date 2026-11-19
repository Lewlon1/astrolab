// Renders the instant reading (composeReading output) as a Lab report card:
// title, then the report card (Gabs's signed card line, card/Sun/Moon, both lenses and
// "Put it into practice" as its bottom band), then the remaining text.
import type { InstantReading } from "@/lib/lab/reading";
import type { Card } from "@/content/lab/cards";
import CardFace from "./CardFace";
import styles from "./lab.module.css";
import { STANCE_LINE } from "@/content/lab/reading";
import { READING_NOTES, REPORT } from "@/content/lab/ui";
import LabNote from "./LabNote";
import { HAND_NOTE } from "./classes";

type Props = {
  reading: InstantReading;
  /** The chosen card, shown beside the headline so the image stays in view. */
  card?: Card | null;
  /** id for the headline, so the section can be aria-labelledby it. */
  headingId: string;
  /** Show "Put it into practice" inside the card. Default true; /apply's demo reveals it later. */
  showPractice?: boolean;
  /** Show the stance line under the reading. Default true; /apply hides it (ad-page wording rules). */
  showStance?: boolean;
};

const UNCERTAIN = "m-0 max-w-[62ch] border-l-2 border-gold2 pl-3 text-[14px] text-midBrown";

export default function Reading({ reading, card, headingId, showPractice = true, showStance = true }: Props) {
  const opening = reading.paragraphs.find((p) => p.kind === "open");
  const body = reading.paragraphs.filter((p) => p.kind !== "open");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {card && (
          <div className="w-[72px] shrink-0 sm:w-[96px]">
            <div className={styles.staticCard}>
              <CardFace card={card} ariaHidden sizes="96px" />
            </div>
          </div>
        )}
        <h2
          id={headingId}
          className="m-0 min-w-0 font-fraunces text-[clamp(28px,6vw,40px)] font-medium leading-[1.05] !text-deepBrown [text-wrap:balance]"
        >
          {reading.headline}
        </h2>
      </div>

      <LabNote
        {...reading.labNote}
        test={showPractice ? reading.labNote.test : undefined}
        label={REPORT.label}
        quote={opening ? { text: opening.text, by: REPORT.signature } : undefined}
        specimen={reading.chips}
        headingId={`${headingId}-note`}
      />

      {body.length > 0 && (
        <div className="flex flex-col gap-4 text-[17px] leading-[1.6]">
          {body.map((p, i) => (
            <p key={i} className="m-0 max-w-[62ch]">
              {p.text}
            </p>
          ))}
        </div>
      )}

      {reading.cuspNote && <p className={UNCERTAIN}>{reading.cuspNote}</p>}
      {reading.approximateZone && <p className={UNCERTAIN}>{READING_NOTES.approximateZone}</p>}

      {showStance && <p className={HAND_NOTE}>{STANCE_LINE}</p>}
    </div>
  );
}
