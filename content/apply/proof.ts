// DRAFT — Gabs to rewrite in her voice
// Testimonials go here ONLY with the client's written consent. An empty list hides the block.

export type Testimonial = {
  quote: string;
  /** First name or initials, as the client agreed. */
  name: string;
  /** e.g. "Client since 2025". Optional. */
  detail?: string;
};

export const TESTIMONIALS: Testimonial[] = [];

// TODO(Lewis + Gabs): confirm exact wording. Background only, never a claim about the offer.
export const CREDENTIAL =
  "Gabs is an astrologer and coach. Her background includes training in psychotherapy, which shapes how she reads a chart: as a set of questions, not answers.";

export const ABOUT = {
  title: "About Gabs",
  // TODO(Gabs): two or three sentences in her own voice.
  body: "Gabs founded The Astro Psyche Lab to bring astrology and psychology into the same conversation.",
} as const;

/** Press or partner mentions. Empty hides the line. */
export const PRESS: string[] = [];
