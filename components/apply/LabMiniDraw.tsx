"use client";

// Variant B's mini draw: a thin wrapper over the Lab's own components and engine.
// Card (LabDeck) → birth date/place, time optional (BirthForm) → instant reading of
// card + Sun + Moon (Reading, via /api/lab/compute) → email gate.
// Imports from /lab; changes nothing there. Never logs birth data.
import { useRef, useState } from "react";
import LabDeck from "@/components/lab/LabDeck";
import BirthForm from "@/components/lab/BirthForm";
import Reading from "@/components/lab/Reading";
import { HAND_NOTE, cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";
import { DRAW } from "@/content/lab/ui";
import { MINI_DRAW } from "@/content/apply/ui";
import EmailCapture, { type Captured, type ReadingSummary } from "./EmailCapture";
import { H2, SECTION } from "./OfferBlocks";
import { reducedMotion, scrollToEl, useLabDraw } from "./useLabDraw";

type Props = {
  onCaptured: (c: Captured, reading: ReadingSummary) => void;
};

export default function LabMiniDraw({ onCaptured }: Props) {
  const [captured, setCaptured] = useState<Captured | null>(null);
  const birthRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const readingRef = useRef<HTMLElement>(null);

  const d = useLabDraw({
    placement: "mini",
    onPicked: () =>
      window.setTimeout(
        () =>
          requestAnimationFrame(() => {
            scrollToEl(birthRef.current);
            dateRef.current?.focus({ preventScroll: true });
          }),
        reducedMotion() ? 0 : 500,
      ),
    onReading: () => requestAnimationFrame(() => scrollToEl(readingRef.current)),
  });
  const { card, reading, summary } = d;

  return (
    <div id="draw" className="flex scroll-mt-6 flex-col gap-10">
      <section aria-labelledby="lp-draw" className={SECTION}>
        <h2 id="lp-draw" className={H2}>
          {MINI_DRAW.drawTitle}
        </h2>
        <p className="m-0 max-w-[62ch] text-midBrown">{MINI_DRAW.drawHint}</p>
        <LabDeck hand={d.hand} pickedIndex={d.picked} onPick={d.pick} />
        <p className={HAND_NOTE} aria-live="polite">
          {card ? `${card.name}. ${DRAW.hold}` : ""}
        </p>
      </section>

      {card && (
        <section ref={birthRef} aria-labelledby="lp-birth" className={cx(SECTION, "scroll-mt-6", styles.reveal)}>
          <h2 id="lp-birth" className={H2}>
            {MINI_DRAW.birthTitle}
          </h2>
          <p className="m-0 max-w-[62ch] text-midBrown">{MINI_DRAW.birthHint}</p>
          <BirthForm ref={dateRef} onSubmit={d.submitBirth} error={d.error} submitting={d.busy} choices={d.choices} onPlaceEdit={d.clearChoices} />
        </section>
      )}

      {reading && card && summary && (
        <section ref={readingRef} aria-labelledby="lp-reading" className={cx(SECTION, "scroll-mt-6", styles.reveal)}>
          <p className="m-0 font-dm-mono text-[12px] uppercase tracking-[0.14em] text-midBrown">{MINI_DRAW.readingTitle}</p>
          {/* No stance line on /apply: its wording names therapy (Hard rule 4). */}
          <Reading reading={reading} card={card} headingId="lp-reading" showStance={false} />

          <div className="mt-4 flex flex-col gap-4 rounded-[16px] bg-deepBrown p-5 text-cream2 sm:p-7">
            <h2 className="m-0 font-fraunces text-[clamp(24px,5vw,30px)] font-medium leading-[1.15] !text-cream2">{MINI_DRAW.gateTitle}</h2>
            {captured ? (
              <p role="status" className="m-0">
                {MINI_DRAW.gateDone.replace("{email}", captured.email)}
              </p>
            ) : (
              <>
                <p className="m-0 text-cream2/85">{MINI_DRAW.gateBody}</p>
                {/* Light card inside the dark panel keeps the shared form's contrast. */}
                <div className="rounded-[12px] bg-cream2 p-4 text-deepBrown">
                  <EmailCapture
                    placement="gate"
                    reading={summary}
                    submitLabel={MINI_DRAW.gateCta}
                    onCaptured={(c) => {
                      setCaptured(c);
                      onCaptured(c, summary);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
