"use client";

// Shared state for the Lab draw on /apply (variant B's mini draw and variant A's demo).
// Card pick → /api/lab/compute → instant reading. Never logs birth data.
import { useEffect, useState } from "react";
import { CARDS, type Card } from "@/content/lab/cards";
import { signChip } from "@/content/lab/reading";
import { drawCards } from "@/lib/lab/deck";
import type { InstantReading } from "@/lib/lab/reading";
import { HAND_SIZE } from "@/components/lab/LabDeck";
import type { BirthValues, FormError, PlaceChoice } from "@/components/lab/BirthForm";
import { postJson, type ReadingSummary } from "./EmailCapture";
import { useLp } from "./LpContext";

type ComputeResponse = { choices: PlaceChoice[] } | { reading: InstantReading };

export function useLabDraw(opts: { placement: "mini" | "demo"; onPicked?: () => void; onReading?: () => void }) {
  const { lpTrack } = useLp();
  const [hand, setHand] = useState<Card[] | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [reading, setReading] = useState<InstantReading | null>(null);
  const [choices, setChoices] = useState<PlaceChoice[] | null>(null);
  const [error, setError] = useState<FormError>(null);
  const [busy, setBusy] = useState(false);

  // Shuffle after mount so the server renders face-down backs (no hydration mismatch).
  useEffect(() => setHand(drawCards(CARDS, HAND_SIZE)), []);

  const card = hand && picked !== null ? hand[picked] : null;

  const pick = (i: number) => {
    if (!hand || picked !== null) return;
    setPicked(i);
    lpTrack("lp_draw_started", { card: hand[i].name, placement: opts.placement });
    opts.onPicked?.();
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
    lpTrack("lp_reading_viewed", { card: card.name, has_time: Boolean(values.time), placement: opts.placement });
    opts.onReading?.();
  };

  const summary: ReadingSummary | null =
    card && reading ? { card: card.name, sun: signChip(reading.sun), moon: signChip(reading.moon) } : null;

  return { hand, picked, card, pick, reading, choices, clearChoices: () => setChoices(null), error, busy, submitBirth, summary };
}

export const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const scrollToEl = (el: HTMLElement | null) =>
  el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
