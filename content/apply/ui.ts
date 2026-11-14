// DRAFT — Gabs to rewrite in her voice
// Page copy for /apply that isn't offer, proof, FAQ or application copy.

export const PAGE_META = {
  title: "Apply | The Astro Psyche Lab",
  description: "Apply for a place in the Q1 Lab with Gabs: four private sessions, January to March 2027.",
} as const;

export const CTA = {
  apply: "Apply for a place",
  drawFirst: "Draw your card first",
} as const;

export const SECTIONS = {
  forWho: "Who it's for",
  notFor: "Who it's not for",
  inclusions: "What you get",
  howItWorks: "How it works",
  proof: "What clients say",
  /** Under testimonials that were given in Spanish. */
  translated: "Translated from Spanish",
  faq: "Questions",
  priceLabel: "Price",
} as const;

/** Variant B: mini draw and email gate. */
export const MINI_DRAW = {
  drawTitle: "Choose the card you're drawn to",
  drawHint: "Don't deliberate. Pick the one that pulls you first.",
  birthTitle: "Your birth date and place",
  birthHint: "Time is optional. It adds your rising sign.",
  readingTitle: "Your card, Sun and Moon",
  gateTitle: "Get your full reading and see if the Q1 Lab fits you",
  gateBody: "We'll email your reading, then show you the Q1 Lab below.",
  gateCta: "Show me",
  gateDone: "Sent. Your reading is on its way to {email}.",
} as const;

export const BRAND = {
  name: "The Astro Psyche Lab",
  homeLabel: "The Astro Psyche Lab home",
} as const;
