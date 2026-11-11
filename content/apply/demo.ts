// DRAFT — Gabs to rewrite in her voice
// Variant A's "How the Lab works" demo: the visitor runs the method on their own card
// and chart. Each step pairs what happens here ("In the Lab") with what the programme
// does over the year ("In the programme").

export type DemoStepKey = "draw" | "map" | "read" | "test";

export type DemoStep = {
  key: DemoStepKey;
  /** Short label on the progress rail. */
  rail: string;
  title: string;
  /** One line, always visible. */
  lab: string;
  /** Shown under "In the programme" (behind "More" on phones). */
  programme: string;
};

export const DEMO_STEPS: DemoStep[] = [
  {
    key: "draw",
    rail: "Draw",
    title: "Choose the card you're drawn to",
    lab: "Pick quickly. The image you reach for first says something about what's on your mind.",
    programme: "Each month opens with a draw, so you can see which themes keep coming back.",
  },
  {
    key: "map",
    rail: "Map",
    title: "Your birth date and place",
    lab: "Your chart is the map. Here we read your Sun and Moon. Time is optional and adds your rising sign.",
    programme: "Your whole chart, plus the main transits of 2027, mapped month by month.",
  },
  {
    key: "read",
    rail: "Read",
    title: "Read it through two lenses",
    lab: "Every Lab reading sets what astrology says beside what psychology studies, and labels which is which.",
    programme: "A full reading with Gabs every month, built on what you noticed since the last one.",
  },
  {
    key: "test",
    rail: "Test",
    title: "Put it into practice",
    lab: "Each reading ends with one small thing to try this week, so it turns into something you can notice.",
    programme: "Gabs reviews your experiments with you each month and adjusts the plan.",
  },
];

export const DEMO_UI = {
  eyebrow: "How the Lab works",
  title: "Try the method on yourself",
  intro: "Four steps, about two minutes. It's the same method the programme uses, on a smaller scale.",
  heroLink: "Or try the method first",
  railLabel: "Lab method progress",
  labLabel: "In the Lab",
  programmeLabel: "In the programme",
  more: "How the programme does this",
  gateTitle: "See step 4: what to try this week",
  gateBody: "Add your email to unlock your practice step. We'll send your reading too.",
  gateCta: "Show me",
  gateDone: "Unlocked. Your reading is on its way to {email}.",
  bridge: "That's one card and two placements. The programme does this with your whole chart, every month through 2027.",
  bridgeCta: "Apply for a place",
} as const;
