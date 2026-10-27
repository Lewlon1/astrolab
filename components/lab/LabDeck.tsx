"use client";

// Three face-down major arcana. Before the client shuffle (hand === null) the
// buttons render as identical, disabled card backs, so server markup is stable.
import type { Card } from "@/content/lab/cards";
import { DRAW } from "@/content/lab/ui";
import CardFace from "./CardFace";
import { MOTIF_COLORS, SunMotif } from "./motifs";
import styles from "./lab.module.css";

type Props = {
  /** The three drawn cards, or null until the client has shuffled. */
  hand: readonly Card[] | null;
  /** Index of the chosen card, or null before a pick. */
  pickedIndex: number | null;
  onPick: (index: number) => void;
};

const SLOTS = [0, 1, 2] as const;

export default function LabDeck({ hand, pickedIndex, onPick }: Props) {
  const picked = pickedIndex !== null;
  return (
    <div className={styles.deck}>
      {SLOTS.map((i) => {
        const card = hand?.[i] ?? null;
        const isChosen = pickedIndex === i;
        const cls = [styles.card, isChosen ? styles.flipped : "", picked && !isChosen ? styles.dim : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={card ? `${card.n}-${i}` : `slot-${i}`}
            type="button"
            className={cls}
            disabled={!card || picked}
            aria-label={isChosen && card ? `${card.name}, ${DRAW.chosenLabel}` : DRAW.faceDownLabel(i + 1)}
            onClick={() => onPick(i)}
          >
            <div className={styles.inner}>
              <div className={`${styles.face} ${styles.back}`}>
                <SunMotif color={MOTIF_COLORS.gold2} rays={20} />
              </div>
              {card && <CardFace card={card} ariaHidden />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
