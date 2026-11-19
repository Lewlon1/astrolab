// DRAFT — Gabs to rewrite in her voice
// The application (Acquisition Bible v3 section 4): step 1 is email + consent, then
// three steps: what they want different by April, what keeps repeating, and birth
// date and place (time optional). After it, the Cal.com calendar shows inline.
// Server validation reads this file too, so ids and kinds are the contract between
// the form and /api/apply.

export type Question =
  | { id: string; kind: "text"; label: string; hint?: string; required: boolean; maxLength: number; autoComplete?: string }
  | { id: string; kind: "textarea"; label: string; hint?: string; required: boolean; maxLength: number }
  | { id: string; kind: "date"; label: string; hint?: string; required: boolean; maxLength: number }
  | { id: string; kind: "time"; label: string; hint?: string; required: boolean; maxLength: number }
  | { id: string; kind: "choice"; label: string; hint?: string; required: boolean; options: { value: string; label: string }[] };

/** One screen of the form. A step with one field uses the field's label as its heading. */
export type Step = { id: string; title?: string; hint?: string; fields: Question[] };

export const STEPS: Step[] = [
  {
    id: "april",
    fields: [
      {
        id: "want_by_april",
        kind: "textarea",
        label: "What do you want to be different by April?",
        hint: "A sentence or two is plenty.",
        required: true,
        maxLength: 1000,
      },
    ],
  },
  {
    id: "repeats",
    fields: [
      {
        id: "keeps_repeating",
        kind: "textarea",
        label: "What keeps repeating, however hard you try?",
        hint: "In love, at work or in how you treat yourself. Whatever comes to mind first.",
        required: true,
        maxLength: 1000,
      },
    ],
  },
  {
    id: "birth",
    title: "Your birth date and place",
    hint: "Gabs looks at your chart before the call. Leave the time blank if you don't know it.",
    fields: [
      { id: "birth_date", kind: "date", label: "Date of birth", required: true, maxLength: 10 },
      { id: "birth_place", kind: "text", label: "Town or city of birth", required: true, maxLength: 120 },
      { id: "birth_time", kind: "time", label: "Time of birth (optional)", required: false, maxLength: 5 },
    ],
  },
];

/** Every field, in order. */
export const QUESTIONS: Question[] = STEPS.flatMap((s) => s.fields);

export const APPLICATION_UI = {
  title: "Apply for a place",
  stepLabel: "Step {n} of {total}",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  consent: {
    before: "Email me about the Q1 Lab and my application. Unsubscribe at any time. ",
    linkLabel: "Privacy notice",
    after: ".",
  },
  continue: "Continue",
  back: "Back",
  submit: "Send application",
  submitting: "Sending…",
  saving: "Saving…",
  doneTitle: "Thank you. Your application is in.",
  doneBody: "Now pick a time for your 15-minute call with Gabs.",
  calendarLabel: "Booking calendar for the 15-minute call",
  bookFallback: "Calendar not loading? Open the booking page",
  errors: {
    email: "Enter an email address, like name@example.com.",
    consent: "Tick the box so we can email you about your application.",
    required: "Answer this question to continue.",
    tooLong: "Shorten this answer to {max} characters or fewer.",
    choice: "Choose one of the options.",
    date: "Enter your date of birth, like 14/03/1988.",
    time: "Enter a time like 07:30, or leave it blank.",
    generic: "Something went wrong. Please try again.",
    rateLimited: "Too many attempts. Wait a few minutes, then try again.",
  },
} as const;

/** Bump when the consent sentence changes meaning. Stored with each partial lead. */
export const APPLY_CONSENT_VERSION = "2026-11-13.v1";
