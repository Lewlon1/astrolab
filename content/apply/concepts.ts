// DRAFT — Gabs to rewrite in her voice
// One hero per ad concept. The ad's `?c=` key picks the hero, so the page repeats
// the promise of the ad that sent the click. Unknown or missing keys use `default`.
// Headlines are each concept's hook 1 from Acquisition Bible v3 section 5, except c2:
// its hooks name Gabs's training, which waits on the credential wording (OQ 5), so it
// uses hook 3. Rules (Hard rule 4): no "Are you…?" personal-attribute hooks, no
// outcome promises, no "accurate"/"best", no destiny language.

export type Hero = {
  headline: string;
  subhead: string;
  /** First proof line, shown under the button. */
  proof: string;
};

export const CONCEPT_KEYS = ["c1", "c2", "c3", "c4", "c5"] as const;
export type ConceptKey = (typeof CONCEPT_KEYS)[number] | "default";

const PROOF = "Led by Gabs, founder of The Astro Psyche Lab. Ten places in the January cohort.";

export const CONCEPTS: Record<ConceptKey, Hero> = {
  default: {
    headline: "Ninety days with your own chart",
    subhead:
      "Four private sessions with Gabs, January to March. Your chart is read through psychology, so you can test one pattern you want to change.",
    proof: PROOF,
  },
  // C1 · The Hypothesis
  c1: {
    headline: "Your birth chart isn't a prediction. It's a hypothesis.",
    subhead:
      "The Q1 Lab gives you 90 days to test it: four sessions with Gabs, January to March, and a weekly tracker of what you notice.",
    proof: PROOF,
  },
  // C2 · The Notebook (see the note at the top)
  c2: {
    headline: "Your chart doesn't cause anything. That's exactly why it's useful.",
    subhead:
      "Gabs reads a chart as a set of questions about your patterns. The Q1 Lab gives you 90 days to work through them, January to March.",
    proof: PROOF,
  },
  // C3 · The Pattern
  c3: {
    headline: "You know why you do it. You still do it.",
    subhead:
      "The Q1 Lab looks at the pattern you keep repeating, in love or at work, through your Moon and Venus. Then you test one change over 90 days.",
    proof: PROOF,
  },
  // C4 · The Slow Quarter
  c4: {
    headline: "Early 2027 is a slow quarter in the sky. Use it.",
    subhead:
      "January to March is a good time to study one pattern before you act in April. Four sessions with Gabs, timed to the sky.",
    proof: PROOF,
  },
  // C5 · The Private Room
  c5: {
    headline: "One chart. Four sessions. Ninety days.",
    subhead: "Unhurried hours inside your own chart with Gabs, from January to March, with the price stated plainly below.",
    proof: PROOF,
  },
};

/** Maps a raw `?c=` value to a known concept key. Anything unknown is "default". */
export function resolveConcept(raw: unknown): ConceptKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "default";
  const key = v.trim().toLowerCase();
  return (CONCEPT_KEYS as readonly string[]).includes(key) ? (key as ConceptKey) : "default";
}
