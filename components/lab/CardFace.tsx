"use client";
// The face of a major arcana card: the 1909 Rider-Waite-Smith image (public domain,
// see public/lab/cards/SOURCES.md). If the image fails, falls back to the original
// numeral + motif + name face. Shared by the draw arch, the reading and the profile.
import { useState } from "react";
import { cardImageSrc, type Card } from "@/content/lab/cards";
import { MOTIF_COLORS, StarMotif, SunMotif } from "./motifs";
import styles from "./lab.module.css";

type Props = {
  card: Pick<Card, "numeral" | "motif" | "name" | "image">;
  ariaHidden?: boolean;
  /** Rendered width in CSS px, for the browser's srcset pick. */
  sizes?: string;
  /** Load eagerly (above the fold). */
  priority?: boolean;
};

export default function CardFace({ card, ariaHidden = false, sizes = "140px", priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <div className={`${styles.face} ${styles.photo}`} aria-hidden={ariaHidden ? "true" : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static WebP with srcset; no optimiser needed */}
        <img
          src={cardImageSrc(card, 240)}
          srcSet={`${cardImageSrc(card, 240)} 240w, ${cardImageSrc(card, 480)} 480w`}
          sizes={sizes}
          width={240}
          height={413}
          alt=""
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${styles.face} ${styles.front}`} aria-hidden={ariaHidden ? "true" : undefined}>
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
