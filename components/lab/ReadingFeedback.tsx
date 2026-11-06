"use client";
// Thumbs up/down at the end of the instant reading. Anonymous: keyed by the
// reading's draw id, linked to the profile at the gate (POST /api/lab/feedback).
// The vote can be changed; a failed save reverts it and says so.
import { useState } from "react";
import type { InstantReading } from "@/lib/lab/reading";
import type { LabSrc } from "@/lib/lab/validate";
import { FEEDBACK } from "@/content/lab/ui";
import { track } from "@/lib/analytics/track";
import { FOCUS, cx } from "./classes";

type Vote = 1 | -1;

type Props = {
  drawId: string;
  card: string;
  /** All cards dealt with it (including the chosen one), for "chosen when shown" rates. */
  shown: string[] | null;
  reading: InstantReading;
  hasTime: boolean;
  src: LabSrc | null;
};

const BTN = cx(
  "inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-deepBrown bg-transparent text-deepBrown",
  "cursor-pointer hover:border-coral2 hover:text-coral2 aria-pressed:border-deepBrown aria-pressed:bg-deepBrown aria-pressed:text-cream2",
  FOCUS,
  "focus-visible:outline-coral2",
);

function Thumb({ down = false }: { down?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={down ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Z" />
      <path d="M7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
    </svg>
  );
}

export default function ReadingFeedback({ drawId, card, shown, reading, hasTime, src }: Props) {
  const [vote, setVote] = useState<Vote | null>(null);
  const [failed, setFailed] = useState(false);

  const send = async (next: Vote) => {
    if (next === vote) return;
    const previous = vote;
    setVote(next);
    setFailed(false);
    track("interaction", "lab_reading_rated", { src, card, vote: next, relation: reading.relation, has_time: hasTime });
    try {
      const res = await fetch("/api/lab/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId, vote: next, card, shown, sun: reading.sun, moon: reading.moon, relation: reading.relation, hasTime, src }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setVote(previous);
      setFailed(true);
    }
  };

  return (
    <div role="group" aria-labelledby="lab-feedback-q" className="flex flex-wrap items-center gap-3 border-t border-cardBorder pt-4">
      <p id="lab-feedback-q" className="m-0 font-fraunces text-[18px] !text-deepBrown">
        {FEEDBACK.question}
      </p>
      <div className="flex gap-2">
        <button type="button" className={BTN} aria-pressed={vote === 1} aria-label={FEEDBACK.up} onClick={() => send(1)}>
          <Thumb />
        </button>
        <button type="button" className={BTN} aria-pressed={vote === -1} aria-label={FEEDBACK.down} onClick={() => send(-1)}>
          <Thumb down />
        </button>
      </div>
      <p role="status" className="m-0 basis-full text-[14px] text-midBrown">
        {failed ? FEEDBACK.failed : vote !== null ? FEEDBACK.thanks : ""}
      </p>
    </div>
  );
}
