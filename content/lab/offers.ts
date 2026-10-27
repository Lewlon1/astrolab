// DRAFT — Gabs to rewrite in her voice
// The ladder of paid sessions shown on the Lab profile. Name, price and booking
// link come from the `services` table (by slug), so they stay in step with the
// services CMS; only the one-line framing for Lab visitors lives here.

export type LabOfferRole = "primary" | "secondary";

export type LabOfferCopy = {
  slug: string;
  role: LabOfferRole;
  /** One line for someone who has just seen their card and chart. {card} is filled in. */
  pitch: string;
};

/** Shown in this order. Exactly one primary. */
export const LAB_OFFERS: readonly LabOfferCopy[] = [
  {
    slug: "astro-psyche-blend",
    role: "primary",
    pitch: "Your whole chart, read with you, starting from {card}. The natural next step from this profile, and easy if you are new to astrology.",
  },
  {
    slug: "cosmic-quick-hit",
    role: "secondary",
    pitch: "A short, personal message on your Sun, Moon and Rising for one area of life: love, work or growth.",
  },
  {
    slug: "stellar-insights",
    role: "secondary",
    pitch: "A 90-minute deep reading of your patterns and blind spots, with practical tools to work with.",
  },
];

export const OFFERS_UI = {
  title: "Work with Gabs",
  intro: "{card} opened a question. A session is where you work through it, with someone who reads both the chart and the psychology.",
  startHere: "Start here",
  /** Button label for an offer. */
  book: (name: string, price: string | null) => (price ? `Book ${name} · ${price}` : `Book ${name}`),
  membershipSoon:
    "Coming soon: Lab membership, with a Check-In timed to each season's peak. You'll hear about it first, by email.",
} as const;
