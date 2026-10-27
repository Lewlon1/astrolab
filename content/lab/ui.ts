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
  lede: "Free. Your card read against your chart, your rising sign, and a monthly Lab note.",
  gets: [
    { title: "Your card, read against your chart", body: "What your pick suggests is on your mind, read through your Sun, Moon and Rising." },
    { title: "Your rising sign", body: "Needs your birth time. Add it below or later." },
    { title: "Your next two seasons", body: "The transit themes coming up for you, and when." },
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
    settings: "Your data",
  },
  risingLocked: "Add your birth time to see your rising sign.",
  risingNoTime: "Without a time, the profile skips houses and the rising sign rather than guessing.",
  transitNone: "No major transit themes in the coming months. A quiet stretch is a good time to look back at the last one.",
  addTime: "Add birth time",
} as const;

/** Delete-confirmation copy (new draft). */
export const DELETE = {
  button: "Delete my profile",
  title: "Delete your Lab profile?",
  body: "This erases your birth data, chart and card from your profile, replaces your email there with a placeholder, and removes you from our monthly notes list. We keep a record that you signed up and your sign-in account, but nothing that describes your chart. It cannot be undone.",
  confirm: "Yes, delete everything",
  cancel: "Keep my profile",
  done: "Your profile has been deleted.",
} as const;

/** Booking CTA copy (new draft). */

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

/** API route messages and constants (new draft). */
export const API = {
  badRequest: "That request could not be read. Please try again.",
  consentInvalid: "Please tick the consent box so we can store your birth data.",
  geocodeUnavailable: "We couldn't look up that place right now. Try again in a minute.",
  serverError: "Something went wrong on our side. Please try again in a moment.",
  otpFailed: "We couldn't send the sign-in link. Try again in a minute.",
  unauthorized: "Please sign in to continue.",
  profileNotFound: "We couldn't find your profile.",
  attribution: "© OpenStreetMap contributors",
} as const;

/** /lab page metadata (new draft). */
export const LAB_META = {
  title: "The Lab · Astropsyche Lab",
  description:
    "Draw one of three face-down major arcana cards, add your birth data, and see how the card meets your chart. A two-minute experiment from the Astropsyche Lab.",
} as const;

/** Banner shown when /auth/callback redirects back with ?auth=error (new draft). */
export const AUTH_ERROR = "That sign-in link has expired. Enter your email again to get a new one.";

/** Place-search attribution under the place field (new draft). */
export const OSM_ATTRIBUTION = {
  before: "Place search ",
  linkLabel: "© OpenStreetMap contributors",
  href: "https://www.openstreetmap.org/copyright",
} as const;

/** Extra notes on the instant reading (new draft). */
export const READING_NOTES = {
  approximateZone:
    "We could only place your birth time zone approximately, so a position near a sign change may read differently in your full profile.",
} as const;

/** Gate field labels not covered by GATE (new draft). */
export const GATE_EXTRA = {
  consentLabel: "Consent",
  submitting: "Opening your profile…",
} as const;

/** Birth-form busy label (new draft). */
export const BIRTH_EXTRA = {
  submitting: "Reading your card and chart…",
  placeHint: "Many places share a name. Add the country, like “Santiago, Chile”.",
} as const;

/** Shown when a place name matches several places, so the visitor picks the right one (new draft). */
export const PLACE_PICK = {
  title: "Which one is it?",
  hint: "That name matches more than one place. Pick the one you were born in.",
} as const;

/** Banner on the profile while the email is not yet verified (new draft). */
export const PROFILE_UNVERIFIED = {
  title: "Your profile is open on this device.",
  body: "We've emailed you a sign-in link. Open it to keep this profile and come back on any device. Without it, this profile stays on this browser for 7 days.",
  mailFailed:
    "We couldn't send your sign-in link just now, so this profile stays on this browser for 7 days. Enter your details again from the Lab page later to get a link.",
} as const;

/** Under the reading: which place the chart was built for, and a way to fix it (new draft). */
export const PLACE_CONFIRM = {
  label: "Birth place",
  change: "Not right? Change place",
} as const;

/** The "sent" state after a successful gate submit (new draft). No example transit here. */
export const SENT = {
  title: "Check your inbox",
  body: (email: string) => `Check your inbox — we've sent a sign-in link to ${email}.`,
  hint: "Open the link on this device to see your profile. It can take a minute to arrive.",
  previewTitle: "What your profile holds",
  tiles: {
    sunMoon: { label: "Sun · Moon", body: "Read through the theme of the card you drew." },
    risingWithTime: { label: "Rising", value: "From your birth time", body: "Calculated from your birth time and place." },
    risingNoTime: {
      label: "Rising",
      value: "Add your birth time",
      body: "Without a time, the profile skips houses and the rising sign rather than guessing.",
    },
    card: { label: "Your card", body: "Saved with your profile, so you can come back to it." },
  },
} as const;

/** Profile page extras: aria labels, table headings, form copy, links (new draft). */
export const PROFILE_EXTRA = {
  sunLabel: "Sun",
  moonLabel: "Moon",
  risingLabel: "Rising",
  cardAlt: (card: string) => `Your card: ${card}`,
  tableCaption: "Every position in your chart",
  tableIntro: "Every position in your chart, by planet, sign and degree.",
  colPlanet: "Planet",
  colSign: "Sign",
  colDegree: "Degree",
  colHouse: "House",
  degreeUnit: (d: number) => `${d}\u00b0`,
  degreeUnknown: "Not shown",
  timeLabel: "Birth time",
  timeHint: "24-hour, like 14:30",
  timeSaving: "Saving…",
  timeSaveError: "We couldn't save your time. Please try again.",
  bookingNote: "Booking opens in a new tab.",
  privacyLink: "How we handle your data",
  deleteWorking: "Deleting…",
  deleteError: "We couldn't delete your profile. Please try again.",
  homeLink: "Back to the homepage",
  errorRetry: "Try again",
  errorBack: "Back to the Lab Draw",
} as const;

/** Booking link target for the profile CTA. */
export const BOOKING_URL = "https://cal.com/theastropsychelab";

/**
 * The profile page, written to explain the Lab as it goes (new draft). Each
 * section opens with the Lab layer it shows and closes with the question a
 * session would take further.
 */
export const PROFILE_FLOW = {
  layers: {
    card: "Layer one · The card",
    chart: "Layer two · The chart",
    test: "Layer three · The test",
  },
  cardLine:
    "In psychology, what you reach for in an ambiguous image is called a projective choice: it says something about what is on your mind. So we start with your card.",
  heroTitle: (card: string) => `You reached for ${card}`,
  themeLabel: "The theme it points to",
  chartLine: "The chart is read as a map of patterns, not a forecast. Here we read it through your card's theme.",
  chartTitle: (theme: string) => `Your chart through ${theme.charAt(0).toLowerCase()}${theme.slice(1)}`,
  readNote: "Read the full note",
  testLine: "One thing to notice this month, so you can check the reading against your own life.",
  testTitle: "Your Lab experiment",
  testClose: "Bring what you notice to a session with Gabs. It is the best place to start.",
  upcomingLabel: "What's next",
  upcomingTitle: "Your next two seasons",
  upcomingLine: "A transit is read as a prompt to notice, not a forecast. These are the next two themes in your chart.",
  upcomingClose: "Want to meet these seasons with a plan? This is exactly what Gabs works through in a session.",
  now: "Now",
  fullChart: "See your full chart",
} as const;
