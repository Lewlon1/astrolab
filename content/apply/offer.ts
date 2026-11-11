// DRAFT — Gabs to rewrite in her voice
// PLACEHOLDER OFFER. The final offer (Lab Programme vs 2027 Map / Roadmap), price,
// inclusions and cap are not decided. Change them here; no component holds offer copy.

export const MARKETS = ["uk", "us"] as const;
export type Market = (typeof MARKETS)[number];

export function isMarket(v: unknown): v is Market {
  return typeof v === "string" && (MARKETS as readonly string[]).includes(v);
}

export type Price = {
  /** Full price as shown, e.g. "£1,200". */
  full: string;
  /** Instalment option as shown, or null to hide it. */
  instalments: string | null;
};

export const OFFER = {
  // PLACEHOLDER: name not final.
  name: "The 2027 Lab Programme",
  // PLACEHOLDER: outcome line. Describe what they do, not a result they are promised.
  outcome:
    "Twelve months of working with your chart as a map of your patterns, with Gabs alongside you to plan the year.",
  // PLACEHOLDER: deliverables not final.
  inclusions: [
    { title: "Your 2027 Map", body: "A written map of your natal chart and the year's main transits, read through a psychological lens." },
    { title: "Monthly 1:1 sessions", body: "Twelve 60-minute video sessions with Gabs, one a month." },
    { title: "Quarterly planning", body: "Four check-ins to review what you noticed and adjust the plan." },
    { title: "Between-session notes", body: "Short written prompts after each session so the work keeps going." },
  ],
  // PLACEHOLDER: prices not final. Market sets currency only.
  price: {
    uk: { full: "£TBC", instalments: "or 3 payments of £TBC" },
    us: { full: "$TBC", instalments: "or 3 payments of $TBC" },
  } satisfies Record<Market, Price>,
  /** Real cap only. Set to null if Gabs does not confirm one. PLACEHOLDER. */
  cap: "10 places for 2027" as string | null,
  forWho: [
    "You already know yourself fairly well and want a sharper lens on the patterns that keep coming back.",
    "You're curious about astrology and want it read alongside psychology, not as prediction.",
    "You want a structured year with someone to think it through with.",
  ],
  notFor: [
    "You're looking for predictions about specific events.",
    "You need clinical mental-health support right now. We'll point you to the right professional instead.",
    "You want a one-off reading. The Lab Draw or a single session suits that better.",
  ],
  howItWorks: [
    { title: "Apply", body: "Five short questions. It takes about three minutes." },
    { title: "15-minute call", body: "A short video call with Gabs to see if the programme fits you." },
    { title: "Start", body: "If it's a fit on both sides, you get your welcome pack and first session date." },
  ],
  /** Variant B only: ties the instant reading to the offer. `{card}` and `{sun}` are filled in. */
  bridgeLine:
    "Your {card} and {sun} Sun are a starting point. The programme reads the whole chart, month by month, through 2027.",
} as const;
