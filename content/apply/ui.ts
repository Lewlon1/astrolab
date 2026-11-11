// DRAFT — Gabs to rewrite in her voice
// Page copy for /apply that isn't offer, proof, FAQ or application copy.

export const PAGE_META = {
  title: "Apply | The Astro Psyche Lab",
  description: "Apply for a place in the 2027 programme with Gabs.",
} as const;

export const CTA = {
  apply: "Apply for a place",
  drawFirst: "Draw your card first",
} as const;

export const SECTIONS = {
  video: "Meet Gabs",
  // Shown until the 60–90 s video is filmed.
  videoPlaceholder: "Video coming soon: Gabs explains the programme in 90 seconds.",
  forWho: "Who it's for",
  notFor: "Who it's not for",
  inclusions: "What you get",
  howItWorks: "How it works",
  proof: "What clients say",
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
  gateTitle: "Get your full reading and see if the 2027 programme fits you",
  gateBody: "We'll email your reading, then show you the programme below.",
  gateCta: "Show me",
  gateDone: "Sent. Your reading is on its way to {email}.",
} as const;

export const BRAND = {
  name: "The Astro Psyche Lab",
  homeLabel: "The Astro Psyche Lab home",
} as const;
