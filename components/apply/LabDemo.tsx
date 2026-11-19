"use client";

// Variant A's "How the Lab works" section: the visitor runs the Lab method on their own
// card and chart. Draw → Map → Read → [email] → Test. Each step shows what happens here
// ("In the Lab") and what the programme does with it ("In the programme").
// Reuses the Lab's LabDeck, BirthForm, Reading and PracticeCallout. Never logs birth data.
import { useEffect, useRef, useState, type ReactNode } from "react";
import LabDeck from "@/components/lab/LabDeck";
import BirthForm from "@/components/lab/BirthForm";
import Reading from "@/components/lab/Reading";
import PracticeCallout from "@/components/lab/PracticeCallout";
import { BTN_LIGHT, EYEBROW, FOCUS, HAND_NOTE, LEDE, cx } from "@/components/lab/classes";
import styles from "@/components/lab/lab.module.css";
import { DRAW } from "@/content/lab/ui";
import { DEMO_STEPS, DEMO_UI, type DemoStep } from "@/content/apply/demo";
import EmailCapture, { type Captured } from "./EmailCapture";
import { H2, SECTION } from "./OfferBlocks";
import { useLp } from "./LpContext";
import { reducedMotion, scrollToEl, useLabDraw } from "./useLabDraw";

type Props = {
  /** Email already given (e.g. in the application): skip the gate. */
  captured: Captured | null;
  onCaptured: (c: Captured) => void;
};

function Rail({ active, done }: { active: number; done: number }) {
  return (
    <ol aria-label={DEMO_UI.railLabel} className="m-0 grid list-none grid-cols-4 gap-2 p-0">
      {DEMO_STEPS.map((s, i) => {
        const isDone = i < done;
        const isActive = i === active;
        return (
          <li key={s.key} aria-current={isActive ? "step" : undefined} className="flex flex-col gap-[6px]">
            <span
              aria-hidden="true"
              className={cx("h-[4px] rounded-full", isDone ? "bg-coral2" : isActive ? "bg-deepBrown" : "bg-cardBorder")}
            />
            <span className={cx("font-dm-mono text-[11px] uppercase tracking-[0.12em]", isActive || isDone ? "text-deepBrown" : "text-midBrown")}>
              {String(i + 1).padStart(2, "0")} {s.rail}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Step header plus the method note: the "In the Lab" line, with the programme line behind "More" on phones. */
function Step({ n, step, children, stepRef, notesOpen }: { n: number; step: DemoStep; children: ReactNode; stepRef?: React.Ref<HTMLElement>; notesOpen: boolean }) {
  const id = `lp-demo-${step.key}`;
  return (
    <section ref={stepRef} aria-labelledby={id} className={cx("flex scroll-mt-6 flex-col gap-4", n > 1 && styles.reveal)}>
      <div className="flex items-baseline gap-[14px] border-t-[1.5px] border-deepBrown pt-[14px]">
        <span aria-hidden="true" className="font-fraunces text-[15px] font-medium tabular-nums text-coral2">
          {String(n).padStart(2, "0")}
        </span>
        <h3 id={id} className="m-0 font-fraunces text-[clamp(22px,4.5vw,26px)] font-medium leading-[1.2] !text-deepBrown">
          {step.title}
        </h3>
      </div>
      <div className="flex flex-col gap-2 rounded-[12px] border-l-2 border-gold2 bg-sagePale/60 py-3 pl-4 pr-3 text-[15px]">
        <p className="m-0">
          <span className="mr-2 font-dm-mono text-[11px] uppercase tracking-[0.12em] text-coral2">{DEMO_UI.labLabel}</span>
          {step.lab}
        </p>
        {/* Open on wider screens (toggle hidden); a phone keeps it closed until tapped. */}
        <details className="sm:[&>summary]:hidden" open={notesOpen}>
          <summary className={cx("cursor-pointer list-none text-[14px] text-midBrown underline underline-offset-[3px] [&::-webkit-details-marker]:hidden", FOCUS, "focus-visible:outline-coral2")}>
            {DEMO_UI.more}
          </summary>
          <p className="m-0 mt-1">
            <span className="mr-2 font-dm-mono text-[11px] uppercase tracking-[0.12em] text-coral2">{DEMO_UI.programmeLabel}</span>
            {step.programme}
          </p>
        </details>
      </div>
      {children}
    </section>
  );
}

export default function LabDemo({ captured, onCaptured }: Props) {
  const { lpTrack } = useLp();
  const rootRef = useRef<HTMLElement>(null);
  const birthRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const readRef = useRef<HTMLElement>(null);
  const testRef = useRef<HTMLElement>(null);
  const fired = useRef(new Set<number>());
  // Programme notes start closed on phones. Server render = open; corrected once on mount.
  const [notesOpen, setNotesOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia?.("(max-width: 639px)").matches) setNotesOpen(false);
  }, []);

  /** lp_demo_step fires once per step reached, for the drop-off cut. */
  const reached = (step: number) => {
    if (fired.current.has(step)) return;
    fired.current.add(step);
    lpTrack("lp_demo_step", { step });
  };

  const d = useLabDraw({
    placement: "demo",
    onPicked: () => {
      reached(2);
      window.setTimeout(
        () =>
          requestAnimationFrame(() => {
            scrollToEl(birthRef.current);
            dateRef.current?.focus({ preventScroll: true });
          }),
        reducedMotion() ? 0 : 500,
      );
    },
    onReading: () => {
      reached(3);
      requestAnimationFrame(() => scrollToEl(readRef.current));
    },
  });
  const { card, reading, summary } = d;
  const unlocked = Boolean(reading && captured);

  // Step 1 counts as reached when the demo scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reached(1);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 4 is reached once the reading exists and the email is in.
  useEffect(() => {
    if (!unlocked) return;
    reached(4);
    requestAnimationFrame(() => scrollToEl(testRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const active = unlocked ? 3 : reading ? 2 : card ? 1 : 0;
  const done = unlocked ? 4 : active;

  return (
    <section id="demo" ref={rootRef} aria-labelledby="lp-demo" className={cx(SECTION, "scroll-mt-6 gap-6")}>
      <div className="flex flex-col gap-3">
        <p className={cx(EYEBROW, "text-coral2")}>{DEMO_UI.eyebrow}</p>
        <h2 id="lp-demo" className={H2}>
          {DEMO_UI.title}
        </h2>
        <p className={cx(LEDE, "max-w-[44ch] text-[20px]")}>{DEMO_UI.intro}</p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 bg-cream2/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <Rail active={active} done={done} />
      </div>

      <Step n={1} notesOpen={notesOpen} step={DEMO_STEPS[0]}>
        <LabDeck hand={d.hand} pickedIndex={d.picked} onPick={d.pick} />
        <p className={HAND_NOTE} aria-live="polite">
          {card ? `${card.name}. ${DRAW.hold}` : ""}
        </p>
      </Step>

      {card && (
        <Step n={2} notesOpen={notesOpen} step={DEMO_STEPS[1]} stepRef={birthRef}>
          <BirthForm ref={dateRef} onSubmit={d.submitBirth} error={d.error} submitting={d.busy} choices={d.choices} onPlaceEdit={d.clearChoices} />
        </Step>
      )}

      {reading && card && summary && (
        <Step n={3} notesOpen={notesOpen} step={DEMO_STEPS[2]} stepRef={readRef}>
          {/* Step 4's practice prompt is held back until the email; no stance line on /apply (Hard rule 4). */}
          <Reading reading={reading} card={card} headingId="lp-demo-reading" showPractice={false} showStance={false} />
          {!captured && (
            <div className="flex flex-col gap-4 rounded-[16px] bg-deepBrown p-5 text-cream2 sm:p-7">
              <p className="m-0 font-fraunces text-[clamp(22px,4.5vw,28px)] font-medium leading-[1.15] text-cream2">{DEMO_UI.gateTitle}</p>
              <p className="m-0 text-cream2/85">{DEMO_UI.gateBody}</p>
              <div className="rounded-[12px] bg-cream2 p-4 text-deepBrown">
                <EmailCapture placement="demo" reading={summary} submitLabel={DEMO_UI.gateCta} onCaptured={onCaptured} />
              </div>
            </div>
          )}
        </Step>
      )}

      {unlocked && reading && captured && (
        <Step n={4} notesOpen={notesOpen} step={DEMO_STEPS[3]} stepRef={testRef}>
          <p role="status" className="m-0 text-[14px] text-midBrown">
            {DEMO_UI.gateDone.replace("{email}", captured.email)}
          </p>
          <PracticeCallout text={reading.labNote.test} standalone />
          <p className="m-0 max-w-[40ch] font-heading text-[clamp(22px,4.5vw,28px)] italic leading-[1.3] text-coral2">{DEMO_UI.bridge}</p>
          <div>
            <a href="#apply" className={cx(BTN_LIGHT, "no-underline")} onClick={() => lpTrack("lp_cta_clicked", { placement: "demo" })}>
              {DEMO_UI.bridgeCta}
            </a>
          </div>
        </Step>
      )}
    </section>
  );
}
