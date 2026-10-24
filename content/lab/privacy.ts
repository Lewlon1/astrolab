// DRAFT — Gabs to rewrite in her voice
// NEEDS LEGAL REVIEW before launch: the privacy section below is draft wording, not legal advice.

/** Bump this whenever CONSENT_TEXT or LAB_PRIVACY_SECTION changes meaning. Stored with each consent. */
export const CONSENT_TEXT_VERSION = "2026-10-24.v1";

/** The consent sentence. The UI renders "Privacy notice" as a link to the Lab section of the privacy page. */
export const CONSENT_TEXT = {
  before:
    "Use my birth data and email to build my profile and send monthly Lab notes. I can delete my profile at any time. ",
  linkLabel: "Privacy notice",
  after: ".",
} as const;

export const CONSENT_TEXT_PLAIN = `${CONSENT_TEXT.before}${CONSENT_TEXT.linkLabel}${CONSENT_TEXT.after}`;

/** Draft section for the privacy page. */
export const LAB_PRIVACY_SECTION = {
  heading: "The Lab Draw and Lab profiles",
  intro: "This section covers what we keep when you create a free Lab profile.",
  items: [
    {
      title: "What we store",
      body: "Your email address, your date of birth, your birth time if you give it, your place of birth and its coordinates, the card you drew, the planetary positions we calculate from your birth data, and where you came from (the source of your visit).",
    },
    {
      title: "Why",
      body: "To build your profile and to send you monthly Lab notes. We do not use your birth data for anything else.",
    },
    {
      title: "Where",
      body: "In our database provider (Supabase). Access is limited to the people who run the Lab.",
    },
    {
      title: "How long",
      body: "Until you delete your profile, or until you ask us to. If your profile is inactive for a long time we may remove it.",
    },
    {
      title: "How to delete",
      body: "Use the delete button on your profile page, or email us and we will remove your profile and stop the monthly notes.",
    },
  ],
} as const;
