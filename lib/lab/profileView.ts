// Server-only by convention (the `server-only` package is not installed); pure, no I/O.
// Turns a stored profile row into the sections the profile page renders.
import { BODIES, type Body, type Sign } from "@/lib/astro";
import { CARDS } from "@/content/lab/cards";
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

export type ProfileView = {
  header: { card: string; sun: string; moon: string; rising: string | null };
  hasTime: boolean;
  coreNotes: ProfileNote[];
  positions: PositionRow[];
};

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
  const card = CARDS.find((c) => c.name === row.card_drawn)?.name ?? row.card_drawn;

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
        keyword: isKeywordKey(body) ? KEYWORD_FRAME(title, signs[0], KEYWORDS[body][signs[0]]) : null,
      },
    ];
  });

  const sun = signsOf("Sun");
  const moon = signsOf("Moon");
  return {
    header: {
      card,
      sun: signChip(sun),
      moon: signChip(moon),
      rising: hasTime && chart.rising ? chart.rising : null,
    },
    hasTime,
    coreNotes,
    positions,
  };
}
