// DRAFT — Gabs to rewrite in her voice
// Proof shown right after the price: testimonials, Gabs's photo and background, and
// the refund rule and terms link once they exist. Testimonials go here ONLY with the
// client's consent. An empty list hides the block.

export type Testimonial = {
  quote: string;
  /** First name or initials, as the client agreed. */
  name: string;
  /** e.g. the service they had. Optional. */
  detail?: string;
  /** Given in another language and translated here: the page says so. */
  translated?: boolean;
};

// The three published site testimonials (all in Spanish, from the testimonials table,
// read 13 Nov 2026), translated and shortened. "…" marks a cut. Gabs to approve
// showing them in English, marked as translated (readiness plan, decisions).
// Cuts leave out claims the do-not-say list bans ("accurate", "best").
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The experience felt really personal and genuine, nothing generic. … It left me with a lot of clarity and calm.",
    name: "Andrea C.",
    detail: "Cosmic Alliance",
    translated: true,
  },
  {
    quote:
      "Simply wow. … She blended neuroplasticity techniques based on my chart. … Warm and attentive, too!",
    name: "Amanda H.",
    detail: "Stellar Insights",
    translated: true,
  },
  {
    quote: "I loved it! I found it especially interesting that you explained in the audio why you focused on certain lines.",
    name: "Noemí H.",
    detail: "Soul Guided Travel Magazine",
    translated: true,
  },
];

// TODO(Lewis + Gabs): confirm exact wording (OQ 5). Background only, never a claim about the offer.
export const CREDENTIAL =
  "Gabs is an astrologer and coach. Her background includes training in psychotherapy, which shapes how she reads a chart: as a set of questions, not answers.";

export const ABOUT = {
  title: "About Gabs",
  // TODO(Gabs): two or three sentences in her own voice.
  body: "Gabs founded The Astro Psyche Lab to bring astrology and psychology into the same conversation.",
  photo: { src: "/images/gabriela_door.jpg", alt: "Gabs, founder of The Astro Psyche Lab", width: 1366, height: 2048 },
} as const;

/**
 * Shown beside the price. Each is hidden while null.
 * - refund: Gabs's rule (OQ 7, due Sun 22 Nov).
 * - termsHref: the Q1 Lab terms page, once it exists.
 */
export const PRICE_TERMS = {
  reassurance: "Applying is free and doesn't commit you to anything.",
  refund: null as string | null,
  termsHref: null as string | null,
  termsLabel: "Q1 Lab terms",
};

/** Press or partner mentions. Empty hides the line. */
export const PRESS: string[] = [];
