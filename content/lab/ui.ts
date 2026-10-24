// DRAFT — Gabs to rewrite in her voice
// UI copy for the Lab Draw funnel, the profile page and the homepage teaser.
// Wording comes from the prototype unless marked new.

export const HERO = {
  eyebrow: "A two-minute experiment",
  title: "Draw before you think.",
  lede: "One card for what is alive in you right now. Your birth data for the longer map. The interesting part is how they meet.",
} as const;

export const STEP_TITLES = {
  draw: "Choose the card you're drawn to",
  birth: "Your birth data",
  result: "Your first reading",
  gate: "Keep going",
} as const;

export const DRAW = {
  intro:
    "Three of the 22 major arcana, face down. Don't deliberate. In psychology this is called a projective task: what you reach for in an ambiguous image says something about you.",
  shuffle: "Shuffle a new three",
  hold: "Hold that thought.",
  chosenLabel: "chosen",
  faceDownLabel: (position: number) => `Face-down card ${position} of 3`,
} as const;

export const BIRTH = {
  intro: "Two fields are enough for a first reading. Your birth time adds the rising sign later, if you know it.",
  dateLabel: "Date of birth",
  placeLabel: "Place of birth",
  placePlaceholder: "City, country",
  timeLabel: "Birth time",
  timeOptional: "only if you know it",
  timeHint: "Leave it blank if you're not sure. A wrong time is worse than none.",
  submit: "Read my card and chart",
} as const;

export const ERRORS = {
  dateMissing: "Add your date of birth to continue.",
  placeMissing: "Add the city you were born in. It sets your rising sign later.",
  placeNotFound: "We couldn't find that place. Try city and country.",
  emailInvalid: "Enter a full email address, like name@example.com.",
  consentMissing: "Tick the consent box so we can store your birth data.",
  generic: "Something went wrong on our side. Please try again in a moment.",
} as const;

export const RESULT = {
  chipCard: "Card",
  chipSun: "Sun",
  chipMoon: "Moon",
} as const;

export const GATE = {
  eyebrow: "Step 04 · Keep going",
  title: "Save this as your Lab profile.",
  lede: "Free. Your full chart, your rising sign, and a monthly note on what the sky is doing to your chart.",
  gets: [
    { title: "Full natal chart", body: "Every planet, read through the same three layers." },
    { title: "Your rising sign", body: "Needs your birth time. Add it below or later." },
    { title: "Transit tracker", body: "Your next significant transit and the day it peaks." },
  ],
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  timeLabel: "Birth time",
  timeOptional: "unlocks rising",
  submit: "Create my free profile",
} as const;

export const STANCE =
  "The Lab position: astrology has no proven power to predict events. We use the chart the way a therapist uses a good question, as a structured prompt for noticing your own patterns. Every reading separates what astrology says from what psychology actually studies.";

/** Homepage teaser line (new draft). */
export const HOME_TEASER = {
  line: "Not sure where to start? Draw one card and see how it meets your chart.",
  cta: "Try the Lab Draw",
} as const;

/** Profile page headings and tiles (new draft). */
export const PROFILE = {
  title: "Your Lab profile",
  sections: {
    chart: "Your chart",
    placements: "Your placements",
    rising: "Rising",
    transit: "Next significant transit",
    card: "Your card",
    settings: "Your data",
  },
  risingLocked: "Add your birth time to see your rising sign.",
  risingNoTime: "Without a time, the profile skips houses and the rising sign rather than guessing.",
  transitIntro: "A transit is a prompt to notice, not a forecast.",
  transitNone: "No significant transits in the coming months.",
  addTime: "Add birth time",
} as const;

/** Delete-confirmation copy (new draft). */
export const DELETE = {
  button: "Delete my profile",
  title: "Delete your Lab profile?",
  body: "This removes your email, birth data, chart and card, and stops the monthly notes. It cannot be undone.",
  confirm: "Yes, delete everything",
  cancel: "Keep my profile",
  done: "Your profile has been deleted.",
} as const;

/** Booking CTA copy (new draft). */
export const BOOKING_CTA = {
  title: "Talk it through with Gabs",
  body: "Members get a Check-In with Gabs timed to the peak.",
  button: "Book a Check-In",
} as const;

/** Server-side validation messages (new draft). */
export const VALIDATION = {
  dateInvalid: "Enter your date of birth as YYYY-MM-DD.",
  dateRange: "Your date of birth must be between 1900-01-01 and today.",
  timeInvalid: "Enter your birth time as HH:MM (24-hour), or leave it blank.",
  placeLength: "Enter a place between 2 and 120 characters, like a city and country.",
  cardUnknown: "Pick one of the cards on the table.",
  geocodeBusy: "Our place lookup is busy. Please try again in a few seconds.",
  rateLimited: "Too many tries. Please wait a few minutes and try again.",
} as const;

/** Frame for keyword-only placements on the profile, so they read as a stance, not a trait claim. */
export const KEYWORD_FRAME = (planet: string, sign: string, keyword: string) =>
  `${planet} in ${sign} is read as: ${keyword}.`;

/** Note under an ambiguous placement on the profile (no birth time). */
export const AMBIGUOUS_NOTE = (first: string) =>
  `Without a birth time we can't tell which sign this was in. The reading above uses ${first}. Add your time to settle it.`;
