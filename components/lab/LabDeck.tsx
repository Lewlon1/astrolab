"use client";

// Six face-up major arcana dealt in an arch, like a hand fanned by a dealer.
// Desktop: the arch is large enough to choose from directly.
// Phone: the arch is compact; tapping it spreads the six evenly (3 x 2) so each
// card can be seen before choosing. Every position is a transform driven by CSS
// variables, so the move between arch and spread animates.
// Before the client deal (hand === null) six identical backs render, so server
// markup is stable.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Card } from "@/content/lab/cards";
import { DRAW } from "@/content/lab/ui";
import CardFace from "./CardFace";
import { MOTIF_COLORS, SunMotif } from "./motifs";
import { FOCUS, cx } from "./classes";
import styles from "./lab.module.css";

export const HAND_SIZE = 6;

type Props = {
  /** The dealt cards, or null until the client has shuffled. */
  hand: readonly Card[] | null;
  /** Index of the chosen card, or null before a pick. */
  pickedIndex: number | null;
  onPick: (index: number) => void;
};

const SLOTS = Array.from({ length: HAND_SIZE }, (_, i) => i);
const PHONE = "(max-width: 639px)";

/** Arch and grid coordinates for slot i, as CSS variables. */
function slotVars(i: number): React.CSSProperties {
  const x = i - (HAND_SIZE - 1) / 2; // -2.5 .. 2.5
  return {
    "--i": i,
    "--x": x,
    "--y": x * x,
    "--col": (i % 3) - 1,
    "--row": Math.floor(i / 3),
  } as React.CSSProperties;
}

export default function LabDeck({ hand, pickedIndex, onPick }: Props) {
  const picked = pickedIndex !== null;
  const [phone, setPhone] = useState(false);
  const [spread, setSpread] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(PHONE);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // A new deal on a phone starts gathered again.
  useEffect(() => {
    setSpread(false);
  }, [hand]);

  /** On a phone the arch must be spread before a card can be chosen. */
  const collapsed = phone && !spread && !picked;

  const openSpread = () => {
    setSpread(true);
    window.requestAnimationFrame(() => buttons.current[0]?.focus({ preventScroll: true }));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const at = buttons.current.findIndex((b) => b === document.activeElement);
    if (at < 0) return;
    e.preventDefault();
    const next = (at + (e.key === "ArrowRight" ? 1 : -1) + HAND_SIZE) % HAND_SIZE;
    buttons.current[next]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cx(styles.arch, (spread || picked) && phone && styles.spread)}
        onKeyDown={onKeyDown}
      >
        {SLOTS.map((i) => {
          const card = hand?.[i] ?? null;
          const isChosen = pickedIndex === i;
          return (
            <button
              key={card ? `${card.n}-${i}` : `slot-${i}`}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              style={slotVars(i)}
              className={cx(styles.slot, isChosen && styles.chosen, picked && !isChosen && styles.dim)}
              disabled={!card || picked}
              tabIndex={collapsed ? -1 : undefined}
              aria-hidden={collapsed ? "true" : undefined}
              aria-label={card ? (isChosen ? `${card.name}, ${DRAW.chosenLabel}` : card.name) : DRAW.dealingLabel}
              onClick={() => onPick(i)}
            >
              <span className={cx(styles.cardBody, card && styles.dealt)}>
                {card ? (
                  <CardFace card={card} ariaHidden priority sizes={phone ? "110px" : "140px"} />
                ) : (
                  <span className={`${styles.face} ${styles.back}`}>
                    <SunMotif color={MOTIF_COLORS.gold2} rays={20} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {collapsed && hand && (
          <button
            type="button"
            className={cx(styles.spreadCover, FOCUS, "focus-visible:outline-coral2")}
            aria-label={DRAW.spreadLabel}
            onClick={openSpread}
          />
        )}
      </div>
      {phone && !picked && hand && (
        <p className="m-0 text-center text-[14px] text-midBrown" aria-hidden="true">
          {spread ? DRAW.spreadHint.spread : DRAW.spreadHint.collapsed}
        </p>
      )}
    </div>
  );
}
