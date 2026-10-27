// Server-only by convention (the `server-only` package is not installed); pure, no I/O.
// Instant reading for the Lab Draw. Mirrors the prototype's renderResult().
import type { Sign } from "@/lib/astro";
import { CARDS } from "@/content/lab/cards";
import {
  cuspNote as cuspNoteText,
  headline,
  moonLine,
  openingLine,
  relationOf,
  relationText,
  signChip,
  signInfo,
  traditionParagraph,
  LAYER_LABELS,
} from "@/content/lab/reading";
import { RESULT } from "@/content/lab/ui";
import { THEMES } from "@/content/lab/themes";
import type { StoredChart } from "./types";

/** The slice of a chart composeReading needs: satisfied by computeChart's result and by StoredChart. */
export type ReadingChart = Pick<StoredChart, "positions" | "ambiguous" | "approximateZone" | "rising">;

export type InstantReading = {
  headline: string;
  chips: { label: string; value: string }[];
  paragraphs: { kind: "open" | "body"; text: string }[];
  cuspNote: string | null;
  labNote: { title: string; astro: string; psych: string; test: string };
  sun: Sign[];
  moon: Sign[];
  rising: Sign | null;
  approximateZone: boolean;
};

function signsFor(chart: ReadingChart, body: "Sun" | "Moon"): Sign[] {
  const amb = chart.ambiguous[body];
  if (amb && amb.length > 0) return amb;
  const p = chart.positions.find((x) => x.body === body);
  if (!p) throw new Error(`Chart has no ${body} position`);
  return [p.sign];
}

/**
 * Build the instant reading.
 * @param cardName name of the drawn card, e.g. "The Tower" (must be in CARDS)
 * @param chart a computeChart result or a StoredChart. An ambiguous Sun uses its
 *   first sign plus a cusp note; an ambiguous Moon uses the "X or Y" wording.
 */
export function composeReading(cardName: string, chart: ReadingChart): InstantReading {
  const card = CARDS.find((c) => c.name === cardName);
  if (!card) throw new Error("Unknown card");

  const sun = signsFor(chart, "Sun");
  const moon = signsFor(chart, "Moon");
  const sunInfo = signInfo(sun[0]);
  const moonInfo = signInfo(moon[0]);
  if (!sunInfo || !moonInfo) throw new Error("Unknown sign");

  const rel = relationOf(card, sunInfo.name, moonInfo.name);
  const relText = relationText(rel, { card, sunName: sunInfo.name });
  const theme = THEMES[card.theme];

  return {
    headline: headline(card, sunInfo.name),
    chips: [
      { label: RESULT.chipCard, value: `${card.numeral} · ${card.name}` },
      { label: RESULT.chipSun, value: signChip(sun) },
      { label: RESULT.chipMoon, value: signChip(moon) },
    ],
    paragraphs: [
      { kind: "open", text: openingLine(card) },
      { kind: "body", text: traditionParagraph(card, sunInfo, relText) },
      { kind: "body", text: moonLine(moon, moonInfo) },
    ],
    cuspNote: sun.length > 1 ? cuspNoteText(sun[0]) : null,
    labNote: { title: theme.title, astro: theme.astro, psych: theme.psych, test: theme.test },
    sun,
    moon,
    rising: chart.rising,
    approximateZone: chart.approximateZone,
  };
}

export { LAYER_LABELS };
