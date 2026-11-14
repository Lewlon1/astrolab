// DRAFT — Gabs to rewrite in her voice
// Variant A's "How the Lab works" demo: the visitor runs the method on their own card
// and chart. Each step pairs what happens here ("In the Lab") with what the Q1 Lab
// does from January to March ("In the Q1 Lab").

export type DemoStepKey = "draw" | "map" | "read" | "test";

export type DemoStep = {
  key: DemoStepKey;
  /** Short label on the progress rail. */
  rail: string;
  title: string;
  /** One line, always visible. */
  lab: string;
  /** Shown under "In the Q1 Lab" (behind "More" on phones). */
  programme: string;
};

export const DEMO_STEPS: DemoStep[] = [
  {
    key: "draw",
    rail: "Draw",
    title: "Choose the card you're drawn to",
    lab: "Pick quickly. The image you reach for first says something about what's on your mind.",
    programme: "Your sessions start from what's on your mind, the way the card does here.",
  },
  {
    key: "map",
    rail: "Map",
    title: "Your birth date and place",
    lab: "Your chart is the map. Here we read your Sun and Moon. Time is optional and adds your rising sign.",
    programme: "Your whole chart, prepared before session 1, plus a Q1 sky calendar of the dates that matter for you.",
  },
  {
    key: "read",
    rail: "Read",
    title: "Read it through two lenses",
    lab: "Every Lab reading sets what astrology says beside what psychology studies, and labels which is which.",
    programme: "Four private sessions with Gabs, each built on what you noticed since the last one.",
  },
  {
    key: "test",
    rail: "Test",
    title: "Put it into practice",
    lab: "Each reading ends with one small thing to try this week, so it turns into something you can notice.",
    programme: "A weekly tracker, five minutes a week, and a written report on what you tested and found.",
  },
];

export const DEMO_UI = {
  eyebrow: "How the Lab works",
  title: "Try the method on yourself",
  intro: "Four steps, about two minutes. It's the same method the Q1 Lab uses, on a smaller scale.",
  heroLink: "Or try the method first",
  railLabel: "Lab method progress",
  labLabel: "In the Lab",
  programmeLabel: "In the Q1 Lab",
  more: "How the Q1 Lab does this",
  gateTitle: "See step 4: what to try this week",
  gateBody: "Add your email to unlock your practice step. We'll send your reading too.",
  gateCta: "Show me",
  gateDone: "Unlocked. Your reading is on its way to {email}.",
  bridge: "That's one card and two placements. The Q1 Lab does this with your whole chart, from January to March.",
  bridgeCta: "Apply for a place",
} as const;
