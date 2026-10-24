// The face of a drawn card: numeral, motif and name. Static markup, shared by the
// flipping LabDeck and the profile page. Pass `flat` to render it unflipped.
import type { Card } from "@/content/lab/cards";
import { MOTIF_COLORS, StarMotif, SunMotif } from "./motifs";
import styles from "./lab.module.css";

type Props = {
  card: Pick<Card, "numeral" | "motif" | "name">;
  /** Render without the 180deg flip (profile page). */
  flat?: boolean;
  ariaHidden?: boolean;
};

export default function CardFace({ card, flat = false, ariaHidden = false }: Props) {
  return (
    <div
      className={`${styles.face} ${styles.front}${flat ? ` ${styles.flat}` : ""}`}
      aria-hidden={ariaHidden ? "true" : undefined}
    >
      <span className={styles.roman}>{card.numeral}</span>
      {card.motif === "sun" ? (
        <SunMotif color={MOTIF_COLORS.warmRust} rays={16} />
      ) : (
        <StarMotif color={MOTIF_COLORS.warmRust} />
      )}
      <span className={styles.name}>{card.name}</span>
    </div>
  );
}
