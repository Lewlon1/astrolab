// DRAFT — Gabs to rewrite in her voice
// The application. Step 1 (email + consent) is fixed; the questions below are steps 2+.
// Keep it to 5–7 questions. Server validation reads this file too, so ids and options
// are the contract between the form and /api/apply.

export type Question =
  | { id: string; kind: "text"; label: string; hint?: string; required: boolean; maxLength: number; autoComplete?: string }
  | { id: string; kind: "textarea"; label: string; hint?: string; required: boolean; maxLength: number }
  | { id: string; kind: "choice"; label: string; hint?: string; required: boolean; options: { value: string; label: string }[] };

export const QUESTIONS: Question[] = [
  { id: "first_name", kind: "text", label: "Your first name", required: true, maxLength: 60, autoComplete: "given-name" },
  {
    id: "astro_familiarity",
    kind: "choice",
    label: "How well do you know your own chart?",
    required: true,
    options: [
      { value: "new", label: "Hardly at all" },
      { value: "some", label: "I know my Big Three" },
      { value: "deep", label: "I've had readings before" },
    ],
  },
  {
    id: "focus",
    kind: "choice",
    label: "Where do you most want clarity?",
    required: true,
    options: [
      { value: "work", label: "Work and direction" },
      { value: "relationships", label: "Relationships" },
      { value: "self", label: "How I handle myself" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "end_2027",
    kind: "textarea",
    label: "What do you want to be different by the end of 2027?",
    hint: "A sentence or two is plenty.",
    required: true,
    maxLength: 1000,
  },
  {
    // Budget readiness. Options must match the final price once it's set.
    id: "budget_ready",
    kind: "choice",
    label: "The programme is a year-long investment. Is now the right time for that?",
    required: true,
    options: [
      { value: "ready", label: "Yes, I'm ready to invest this year" },
      { value: "instalments", label: "Yes, if I can pay in instalments" },
      { value: "not_now", label: "Not right now" },
    ],
  },
];

export const APPLICATION_UI = {
  title: "Apply for a place",
  stepLabel: "Step {n} of {total}",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  consent: {
    before: "Email me about the programme and my application. Unsubscribe at any time. ",
    linkLabel: "Privacy notice",
    after: ".",
  },
  continue: "Continue",
  back: "Back",
  submit: "Send application",
  submitting: "Sending…",
  saving: "Saving…",
  doneTitle: "Thank you, {name}.",
  doneBody: "Book your 15-minute call with Gabs. Pick any time that suits you.",
  bookCta: "Book the 15-minute call",
  bookFallback: "Open the booking page",
  errors: {
    email: "Enter an email address, like name@example.com.",
    consent: "Tick the box so we can email you about your application.",
    required: "Answer this question to continue.",
    tooLong: "Shorten this answer to {max} characters or fewer.",
    choice: "Choose one of the options.",
    generic: "Something went wrong. Please try again.",
    rateLimited: "Too many attempts. Wait a few minutes, then try again.",
  },
} as const;

/** Bump when the consent sentence changes meaning. Stored with each partial lead. */
export const APPLY_CONSENT_VERSION = "2026-11-11.v1";
