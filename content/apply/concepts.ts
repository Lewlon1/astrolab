// DRAFT — Gabs to rewrite in her voice
// One hero per ad concept. The ad's `?c=` key picks the hero, so the page repeats
// the promise of the ad that sent the click. Unknown or missing keys use `default`.
// Rules (Hard rule 4): no "Are you…?" personal-attribute hooks, no outcome promises,
// no "accurate"/"best", no destiny language.

export type Hero = {
  headline: string;
  subhead: string;
  /** First proof line, shown under the button. */
  proof: string;
};

export const CONCEPT_KEYS = ["c1", "c2", "c3", "c4", "c5"] as const;
export type ConceptKey = (typeof CONCEPT_KEYS)[number] | "default";

export const CONCEPTS: Record<ConceptKey, Hero> = {
  default: {
    headline: "Why capable people repeat the same patterns",
    subhead:
      "A year-long programme that reads your chart through psychology, so you can see your patterns clearly and plan 2027 around them.",
    proof: "Led by Gabs, founder of The Astro Psyche Lab.",
  },
  // TODO(Lewis): paste concept 1 headline + hook from the Acquisition Bible.
  c1: {
    headline: "TODO c1 headline",
    subhead: "TODO c1 subhead",
    proof: "TODO c1 proof line",
  },
  // TODO(Lewis): paste concept 2 headline + hook from the Acquisition Bible.
  c2: {
    headline: "TODO c2 headline",
    subhead: "TODO c2 subhead",
    proof: "TODO c2 proof line",
  },
  // TODO(Lewis): paste concept 3 headline + hook from the Acquisition Bible.
  c3: {
    headline: "TODO c3 headline",
    subhead: "TODO c3 subhead",
    proof: "TODO c3 proof line",
  },
  // TODO(Lewis): paste concept 4 headline + hook from the Acquisition Bible.
  c4: {
    headline: "TODO c4 headline",
    subhead: "TODO c4 subhead",
    proof: "TODO c4 proof line",
  },
  // TODO(Lewis): paste concept 5 headline + hook from the Acquisition Bible.
  c5: {
    headline: "TODO c5 headline",
    subhead: "TODO c5 subhead",
    proof: "TODO c5 proof line",
  },
};

/** Maps a raw `?c=` value to a known concept key. Anything unknown is "default". */
export function resolveConcept(raw: unknown): ConceptKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "default";
  const key = v.trim().toLowerCase();
  return (CONCEPT_KEYS as readonly string[]).includes(key) ? (key as ConceptKey) : "default";
}
