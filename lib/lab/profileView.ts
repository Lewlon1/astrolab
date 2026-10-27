// Server-only by convention (the `server-only` package is not installed); pure, no I/O.
// Turns a stored profile row into the sections the profile page renders.
import { BODIES, type Body, type Sign } from "@/lib/astro";
import { CARDS } from "@/content/lab/cards";
import { LENS, lensText } from "@/content/lab/lens";
import { THEMES, type Theme } from "@/content/lab/themes";
import {
  KEYWORDS,
  PLACEMENTS,
  PLACEMENT_TITLES,
  type KeywordKey,
  type PlacementKey,
} from "@/content/lab/placements";
import { signChip } from "@/content/lab/reading";
import { AMBIGUOUS_NOTE, KEYWORD_FRAME } from "@/content/lab/ui";
import type { LabProfileRow } from "./types";

export type ProfileNote = {
  key: PlacementKey;
  title: string;
  /** Sign(s) the placement is in: two when ambiguous. */
  signs: Sign[];
  astro: string;
  psych: string;
  test: string;
  /** Present only for an ambiguous placement. */
  note: string | null;
};

export type PositionRow = {
  body: Body;
  title: string;
  /** "Leo" or "Leo or Virgo" */
  sign: string;
  /** Whole degrees, floored (0-29); null when ambiguous. */
  degree: number | null;
  /** Null without a birth time. */
  house: number | null;
  /** Stance-framed keyword line for outer/personal planets without a full reading; else null. */
  keyword: string | null;
};

/** Sun, Moon or Rising, read through the card's theme. */
export type BigThreeItem = {
  key: "Sun" | "Moon" | "Rising";
  /** "Leo" or "Leo or Virgo" */
  signLabel: string;
  /** First sentence of the placement's astrology layer. */
  essence: string;
  /** The placement seen through the card's theme. */
  lensLine: string;
  /** The full three-layer note, for "Read the full note". */
  note: ProfileNote;
};

/** The card as a lens. Null if the card is unknown (it never is for a live row). */
export type ProfileLens = {
  theme: Theme;
  /** The card's "now" line. */
  now: string;
  /** Open question under the card. */
  question: string;
  /** Closes the chart section, leading to a session. */
  chartQuestion: string;
};

export type ProfileView = {
  header: { card: string; sun: string; moon: string; rising: string | null };
  hasTime: boolean;
  coreNotes: ProfileNote[];
  lens: ProfileLens | null;
  bigThree: BigThreeItem[];
  positions: PositionRow[];
};

/** Up to and including the first full stop that ends a sentence. */
export function firstSentence(text: string): string {
  const m = /^.*?[.!?](?=\s|$)/.exec(text.trim());
  return m ? m[0] : text.trim();
}

const CORE: { key: PlacementKey; body: Body | "Rising" }[] = [
  { key: "Sun", body: "Sun" },
  { key: "Moon", body: "Moon" },
  { key: "Rising", body: "Rising" },
  { key: "Venus", body: "Venus" },
  { key: "Saturn", body: "Saturn" },
  { key: "NorthNode", body: "NorthNode" },
];

function isKeywordKey(b: string): b is KeywordKey {
  return b in KEYWORDS;
}

/**
 * Build the profile sections from a stored row. Rising and houses appear only
 * when the chart has a birth time; ambiguous placements say "X or Y".
 */
export function buildProfileView(row: LabProfileRow): ProfileView {
  const chart = row.positions;
  const hasTime = chart.hasTime;
  const cardEntry = CARDS.find((c) => c.name === row.card_drawn);
  const card = cardEntry?.name ?? row.card_drawn;

  const signsOf = (body: Body): Sign[] => {
    const amb = chart.ambiguous[body];
    if (amb && amb.length > 0) return amb;
    const p = chart.positions.find((x) => x.body === body);
    return p ? [p.sign] : [];
  };

  const coreNotes: ProfileNote[] = [];
  for (const { key, body } of CORE) {
    let signs: Sign[];
    if (body === "Rising") {
      if (!hasTime || !chart.rising) continue;
      signs = [chart.rising];
    } else {
      signs = signsOf(body);
    }
    if (signs.length === 0) continue;
    const entry = PLACEMENTS[key][signs[0]];
    const ambiguous = signs.length > 1;
    coreNotes.push({
      key,
      title: `${PLACEMENT_TITLES[key]}: ${signChip(signs)}`,
      signs,
      astro: entry.astro,
      psych: entry.psych,
      test: entry.test,
      note: ambiguous ? AMBIGUOUS_NOTE(signs[0]) : null,
    });
  }

  const positions: PositionRow[] = BODIES.flatMap((body) => {
    const p = chart.positions.find((x) => x.body === body);
    if (!p) return [];
    const signs = signsOf(body);
    const ambiguous = signs.length > 1;
    const title = PLACEMENT_TITLES[body as keyof typeof PLACEMENT_TITLES] ?? body;
    return [
      {
        body,
        title,
        sign: signChip(signs),
        degree: ambiguous ? null : Math.floor(p.degree),
        house: hasTime && typeof p.house === "number" ? p.house : null,
        keyword: isKeywordKey(body) && !ambiguous ? KEYWORD_FRAME(title, signs[0], KEYWORDS[body][signs[0]]) : null,
      },
    ];
  });

  const sun = signsOf("Sun");
  const moon = signsOf("Moon");

  const lensEntry = cardEntry ? LENS[cardEntry.theme] : null;
  const vars = { card, sun: signChip(sun), moon: signChip(moon) };
  const lens: ProfileLens | null =
    cardEntry && lensEntry
      ? {
          theme: THEMES[cardEntry.theme],
          now: cardEntry.now,
          question: lensText(lensEntry.question, vars),
          chartQuestion: lensText(lensEntry.chartQuestion, vars),
        }
      : null;

  const bigThree: BigThreeItem[] = coreNotes.flatMap((note) => {
    if (note.key !== "Sun" && note.key !== "Moon" && note.key !== "Rising") return [];
    const signLabel = signChip(note.signs);
    const template = lensEntry ? lensEntry[note.key] : "";
    return [
      {
        key: note.key,
        signLabel,
        essence: firstSentence(note.astro),
        lensLine: template ? lensText(template, { ...vars, sign: signLabel }) : "",
        note,
      },
    ];
  });

  return {
    header: {
      card,
      sun: signChip(sun),
      moon: signChip(moon),
      rising: hasTime && chart.rising ? chart.rising : null,
    },
    hasTime,
    coreNotes,
    lens,
    bigThree,
    positions,
  };
}
