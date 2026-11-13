// DRAFT — Gabs to rewrite in her voice
// The Q1 Lab, as set in Acquisition Bible v3 section 3 (12 Nov 2026). Name, price, places
// and session weeks wait on Gabs's answer to OQ 1 (due Sun 15 Nov). Change them here;
// no component holds offer copy.

export const MARKETS = ["uk", "us"] as const;
export type Market = (typeof MARKETS)[number];

export function isMarket(v: unknown): v is Market {
  return typeof v === "string" && (MARKETS as readonly string[]).includes(v);
}

export type Price = {
  /** Full price as shown, e.g. "£429". */
  full: string;
  /** Instalment option as shown, or null to hide it. */
  instalments: string | null;
};

export const OFFER = {
  // Working name (OQ 1).
  name: "The Q1 Lab",
  // Describes what they do, not a result they are promised.
  outcome:
    "Ninety days with your own chart, read through psychology and timed to the turning points of early 2027. Reflective coaching that uses astrology, not prediction. You leave with a tested understanding of the pattern behind one goal, the evidence in your own tracker, and a plan for April onwards.",
  inclusions: [
    { title: "Your chart, prepared", body: "An intake and full chart preparation before your first session." },
    {
      title: "Four private sessions",
      body: "On video, in the weeks of 11 January (75 minutes), 1 February, 22 February and 29 March (60 minutes each).",
    },
    { title: "Your Q1 sky calendar", body: "The dates in early 2027 that matter for your chart." },
    { title: "The weekly Lab tracker", body: "Five minutes a week to note what you see, so each session starts from evidence." },
    { title: "Two voice-note check-ins", body: "Between sessions, for when something comes up." },
    { title: "A written Lab report", body: "What you tested, what you found, and your plan for April onwards." },
  ],
  // Paid in full. Dollar price is v3's guess until Gabs confirms (OQ 1, OQ 6).
  price: {
    uk: { full: "£429", instalments: null },
    us: { full: "$549", instalments: null },
  } satisfies Record<Market, Price>,
  /** Shown beside the price. */
  priceNote: "Paid in full",
  /** Real cap only. Set to null if Gabs does not confirm one. */
  cap: "10 places in the January cohort." as string | null,
  forWho: [
    "You've done real inner work and still meet the same pattern.",
    "You want a framework, not a fortune.",
    "You can give four sessions and five minutes a week, from January to March.",
  ],
  notFor: [
    "You want predictions or quick answers.",
    "You need support through a crisis. Gabs will point you to the right help instead.",
    "You want a one-off reading. The Lab Draw or a single session suits that better.",
  ],
  howItWorks: [
    { title: "Apply", body: "Your email and three short questions. About two minutes." },
    { title: "15-minute call", body: "A short video call with Gabs to see whether the Q1 Lab fits you." },
    { title: "Start", body: "If it fits on both sides, you pay and get your welcome note. Sessions start the week of 11 January." },
  ],
  /** Variant B only: ties the instant reading to the offer. `{card}` and `{sun}` are filled in. */
  bridgeLine:
    "{card} and your {sun} Sun are a starting point. The Q1 Lab reads your whole chart over four sessions, January to March.",
} as const;
