"use client";

// Variant B's mini draw: a thin wrapper over the Lab's own components and engine.
// Card (LabDeck) → birth date/place, time optional (BirthForm) → instant reading of
// card + Sun + Moon (Reading, via /api/lab/compute) → email gate.
// Imports from /lab; changes nothing there. Never logs birth data.
import { useEffect, useRef, useState } from "react";
import { CARDS, type Card } from "@/content/lab/cards";
import { signChip } from "@/content/lab/reading";
import { drawCards } from "@/lib/lab/deck";
import type { InstantReading } from "@/lib/lab/reading";
import LabDeck, { HAND_SIZE } from "@/components/lab/LabDeck";
import BirthForm, { type BirthValues, type FormError, type PlaceChoice } from "@/components/lab/BirthForm";
import Reading from "@/components/lab/Reading";
import { HAND_NOTE, cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";
import { DRAW } from "@/content/lab/ui";
import { MINI_DRAW } from "@/content/apply/ui";
import EmailCapture, { postJson, type Captured, type ReadingSummary } from "./EmailCapture";
import { H2, SECTION } from "./OfferBlocks";
import { useLp } from "./LpContext";

type ComputeResponse = { choices: PlaceChoice[] } | { reading: InstantReading };

const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });

type Props = {
  onCaptured: (c: Captured, reading: ReadingSummary) => void;
};

export default function LabMiniDraw({ onCaptured }: Props) {
  const { lpTrack } = useLp();
  const [hand, setHand] = useState<Card[] | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [reading, setReading] = useState<InstantReading | null>(null);
  const [choices, setChoices] = useState<PlaceChoice[] | null>(null);
  const [error, setError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const birthRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const readingRef = useRef<HTMLElement>(null);

  // Shuffle after mount so the server renders face-down backs (no hydration mismatch).
  useEffect(() => setHand(drawCards(CARDS, HAND_SIZE)), []);

  const card = hand && picked !== null ? hand[picked] : null;

  const pick = (i: number) => {
    if (!hand || picked !== null) return;
    setPicked(i);
    lpTrack("lp_draw_started", { card: hand[i].name });
    window.setTimeout(
      () =>
        requestAnimationFrame(() => {
          scrollTo(birthRef.current);
          dateRef.current?.focus({ preventScroll: true });
        }),
      reducedMotion() ? 0 : 500,
    );
  };

  const submitBirth = async (values: BirthValues, choice?: PlaceChoice) => {
    if (!card) return;
    setBusy(true);
    setError(null);
    const r = await postJson<ComputeResponse>("/api/lab/compute", {
      date: values.date,
      place: values.place,
      time: values.time || undefined,
      card: card.name,
      src: "ad",
      geo: choice ? { lat: choice.lat, lon: choice.lon, displayName: choice.displayName } : undefined,
    });
    setBusy(false);
    if (!r.ok) {
      setChoices(null);
      return setError(r.error);
    }
    if ("choices" in r.data) return setChoices(r.data.choices);
    setChoices(null);
    setReading(r.data.reading);
    lpTrack("lp_reading_viewed", { card: card.name, has_time: Boolean(values.time) });
    requestAnimationFrame(() => scrollTo(readingRef.current));
  };

  const summary: ReadingSummary | null =
    card && reading ? { card: card.name, sun: signChip(reading.sun), moon: signChip(reading.moon) } : null;

  return (
    <div id="draw" className="flex scroll-mt-6 flex-col gap-10">
      <section aria-labelledby="lp-draw" className={SECTION}>
        <h2 id="lp-draw" className={H2}>
          {MINI_DRAW.drawTitle}
        </h2>
        <p className="m-0 max-w-[62ch] text-midBrown">{MINI_DRAW.drawHint}</p>
        <LabDeck hand={hand} pickedIndex={picked} onPick={pick} />
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
          <BirthForm ref={dateRef} onSubmit={submitBirth} error={error} submitting={busy} choices={choices} onPlaceEdit={() => setChoices(null)} />
        </section>
      )}

      {reading && card && summary && (
        <section ref={readingRef} aria-labelledby="lp-reading" className={cx(SECTION, "scroll-mt-6", styles.reveal)}>
          <p className="m-0 font-dm-mono text-[12px] uppercase tracking-[0.14em] text-midBrown">{MINI_DRAW.readingTitle}</p>
          <Reading reading={reading} card={card} headingId="lp-reading" />

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
