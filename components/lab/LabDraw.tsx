"use client";

// The Lab Draw funnel: draw -> birth -> reading -> gate -> sent (prototype steps 01-04).
// Page views and session start come from AnalyticsProvider in the (public) layout;
// this component only fires the three pre-email interaction events.
import { useCallback, useEffect, useRef, useState } from "react";
import { CARDS, type Card } from "@/content/lab/cards";
import { CONSENT_TEXT_VERSION } from "@/content/lab/privacy";
import { AUTH_ERROR, BIRTH, DRAW, ERRORS, HERO, RESULT, STANCE, STEP_TITLES } from "@/content/lab/ui";
import type { LabSrc } from "@/lib/lab/validate";
import type { InstantReading } from "@/lib/lab/reading";
import { drawCards } from "@/lib/lab/deck";
import { track } from "@/lib/analytics/track";
import { trackLead } from "@/lib/fbpixel";
import { useConsent } from "@/context/ConsentContext";
import LabDeck from "./LabDeck";
import BirthForm, { type BirthValues, type FormError } from "./BirthForm";
import Reading from "./Reading";
import Gate, { type GateValues, type SentInfo } from "./Gate";
import { ERROR_LIGHT, EYEBROW, FOCUS, HAND_NOTE, LEDE, cx } from "./classes";
import { MOTIF_COLORS, SunMotif } from "./motifs";
import styles from "./lab.module.css";

type Props = {
  src: LabSrc | null;
  authError: boolean;
};

type Stage = "draw" | "birth" | "reading" | "gate" | "sent";
const ORDER: Stage[] = ["draw", "birth", "reading", "gate", "sent"];
const atLeast = (stage: Stage, min: Stage) => ORDER.indexOf(stage) >= ORDER.indexOf(min);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** POST JSON and normalise failures into a FormError. Never logs the body. */
async function postJson<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: FormError }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: { message: ERRORS.generic } };
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: unknown; field?: unknown }) | null;
  if (!res.ok || !data) {
    const message = data && typeof data.error === "string" ? data.error : ERRORS.generic;
    const field = data && typeof data.field === "string" ? data.field : undefined;
    return { ok: false, error: { field, message } };
  }
  return { ok: true, data };
}

/** Numbered step rule. `asHeading` is false where the step has its own headline (the reading). */
function StepHead({ n, id, title, asHeading = true }: { n: string; id?: string; title: string; asHeading?: boolean }) {
  const Tag = asHeading ? "h2" : "p";
  return (
    <div className="flex items-baseline gap-[14px] border-t-[1.5px] border-deepBrown pt-[14px]">
      <span aria-hidden="true" className="font-fraunces text-[15px] font-medium tabular-nums text-coral2">
        {n}
      </span>
      <Tag id={id} className="m-0 font-dm-mono text-[12px] font-medium uppercase tracking-[0.14em] !text-deepBrown">
        {title}
      </Tag>
    </div>
  );
}

export default function LabDraw({ src, authError }: Props) {
  const { marketingAllowed } = useConsent();

  const [stage, setStage] = useState<Stage>("draw");
  const [hand, setHand] = useState<Card[] | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [birth, setBirth] = useState<BirthValues | null>(null);
  const [reading, setReading] = useState<InstantReading | null>(null);
  const [birthError, setBirthError] = useState<FormError>(null);
  const [birthBusy, setBirthBusy] = useState(false);
  const [gateError, setGateError] = useState<FormError>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [sent, setSent] = useState<SentInfo | null>(null);

  const birthRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const readingRef = useRef<HTMLElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  const card = hand && pickedIndex !== null ? hand[pickedIndex] : null;

  // Shuffle only after mount, so the server renders three identical face-down backs.
  useEffect(() => {
    setHand(drawCards(CARDS));
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, reducedMotion() ? 0 : ms));
  }, []);

  /** Run after React has committed the newly revealed step. */
  const afterPaint = (fn: () => void) => window.requestAnimationFrame(() => fn());

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });

  const handlePick = (i: number) => {
    if (!hand || pickedIndex !== null) return;
    const chosen = hand[i];
    setPickedIndex(i);
    track("interaction", "lab_card_drawn", { src, card: chosen.name, has_time: false });
    later(() => {
      setStage("birth");
      afterPaint(() => {
        scrollTo(birthRef.current);
        dateRef.current?.focus({ preventScroll: true });
      });
    }, 700);
  };

  const handleBirth = async (values: BirthValues) => {
    if (!card) return;
    setBirthBusy(true);
    setBirthError(null);
    const r = await postJson<{ reading: InstantReading }>("/api/lab/compute", {
      date: values.date,
      place: values.place,
      time: values.time || undefined,
      card: card.name,
      src,
    });
    setBirthBusy(false);
    if (!r.ok) {
      setBirthError(r.error);
      return;
    }
    const hasTime = Boolean(values.time);
    const props = { src, card: card.name, has_time: hasTime };
    track("interaction", "lab_birth_submitted", props);
    setBirth(values);
    setReading(r.data.reading);
    // A resubmit after the gate is open keeps the gate (and anything typed in it).
    setStage((s) => (atLeast(s, "gate") ? s : "reading"));
    afterPaint(() => scrollTo(readingRef.current));
    track("interaction", "lab_result_viewed", props);
    later(() => setStage((s) => (atLeast(s, "gate") ? s : "gate")), 400);
  };

  const handleGate = async (values: GateValues) => {
    if (!card || !birth || !reading) return;
    setGateBusy(true);
    setGateError(null);
    const r = await postJson<{ ok: true }>("/api/lab/gate", {
      email: values.email,
      time: values.time || undefined,
      consent: true,
      consentVersion: CONSENT_TEXT_VERSION,
      card: card.name,
      date: birth.date,
      place: birth.place,
      src,
    });
    setGateBusy(false);
    if (!r.ok) {
      setGateError(r.error);
      return;
    }
    if (marketingAllowed) trackLead(values.email);
    const chip = (label: string) => reading.chips.find((c) => c.label === label)?.value ?? "";
    setSent({
      email: values.email,
      hasTime: Boolean(values.time),
      // First Sun sign only (a cusp birth is explained in the reading); Moon keeps "X or Y".
      sunMoon: `${reading.sun[0]} · ${reading.moon.join(" or ")}`,
      card: chip(RESULT.chipCard),
    });
    setStage("sent");
    afterPaint(() => sentRef.current?.focus());
  };

  const reshuffle = () => setHand(drawCards(CARDS));

  return (
    <div className="flex flex-col gap-14">
      <section aria-labelledby="lab-hero-title" className="flex flex-col gap-[18px]">
        <p className={cx(EYEBROW, "text-coral2")}>{HERO.eyebrow}</p>
        <h1
          id="lab-hero-title"
          className="m-0 font-fraunces text-[clamp(40px,9vw,68px)] font-medium leading-[1.05] tracking-[-0.01em] !text-deepBrown [text-wrap:balance]"
        >
          {HERO.title}
        </h1>
        <p className={LEDE}>{HERO.lede}</p>
        {authError && (
          <p role="alert" className={cx(ERROR_LIGHT, "max-w-[62ch]")}>
            {AUTH_ERROR}
          </p>
        )}
      </section>

      <section aria-labelledby="lab-step-draw" className="flex flex-col gap-4">
        <StepHead n="01" id="lab-step-draw" title={STEP_TITLES.draw} />
        <p className="m-0 max-w-[62ch]">{DRAW.intro}</p>
        <LabDeck hand={hand} pickedIndex={pickedIndex} onPick={handlePick} />
        <div className="flex flex-wrap items-center gap-3">
          {pickedIndex === null && (
            <button
              type="button"
              onClick={reshuffle}
              disabled={!hand}
              className={cx(
                "border-0 bg-transparent p-0 text-[14px] text-midBrown underline underline-offset-[3px] hover:text-coral2",
                FOCUS,
                "focus-visible:outline-coral2",
              )}
            >
              {DRAW.shuffle}
            </button>
          )}
          <p className={HAND_NOTE} aria-live="polite">
            {card ? `${card.name}. ${DRAW.hold}` : ""}
          </p>
        </div>
      </section>

      {atLeast(stage, "birth") && (
        <section
          ref={birthRef}
          aria-labelledby="lab-step-birth"
          className={cx("flex scroll-mt-6 flex-col gap-4", styles.reveal)}
        >
          <StepHead n="02" id="lab-step-birth" title={STEP_TITLES.birth} />
          <p className="m-0 max-w-[62ch]">{BIRTH.intro}</p>
          <BirthForm ref={dateRef} onSubmit={handleBirth} error={birthError} submitting={birthBusy} />
        </section>
      )}

      {atLeast(stage, "reading") && reading && (
        <section
          ref={readingRef}
          aria-labelledby="lab-reading-title"
          className={cx("flex scroll-mt-6 flex-col gap-4", styles.reveal)}
        >
          <StepHead n="03" title={STEP_TITLES.result} asHeading={false} />
          <Reading reading={reading} headingId="lab-reading-title" />
        </section>
      )}

      {atLeast(stage, "gate") && birth && (
        <Gate
          ref={sentRef}
          defaultTime={birth.time}
          onSubmit={handleGate}
          error={gateError}
          submitting={gateBusy}
          sent={sent}
        />
      )}

      <footer className="flex items-start gap-[14px] border-t-[1.5px] border-deepBrown pt-[18px]">
        <SunMotif color={MOTIF_COLORS.gold2} rays={16} className="w-[34px] flex-none" />
        <p className="m-0 max-w-[62ch] text-[15px] text-midBrown">{STANCE}</p>
      </footer>
    </div>
  );
}
