// DRAFT — Gabs to rewrite in her voice
// NEEDS LEGAL REVIEW before launch: the privacy section below is draft wording, not legal advice.

/** Bump this whenever CONSENT_TEXT or LAB_PRIVACY_SECTION changes meaning. Stored with each consent. */
export const CONSENT_TEXT_VERSION = "2026-10-25.v1";

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
      title: "A cookie on your device",
      body: "When you create a profile we set one cookie, \"lab_profile\", so your profile opens straight away in the browser you used, before you confirm your email. It holds a signed reference to your profile, not your birth data, and expires after 7 days or when you delete your profile. Once you open the sign-in link we email you, your account sign-in takes over.",
    },
    {
      title: "How long",
      body: "Until you delete your profile, or until you ask us to. If your profile is inactive for a long time we may remove it.",
    },
    {
      title: "How to delete",
      body: "Use the delete button on your profile page, or email us. Deleting erases your birth data, chart, card and email from your profile and removes you from the monthly notes list. We keep the record that you signed up (our lead and event history) and your sign-in account, which holds only your email address. Email us if you want those removed too.",
    },
  ],
} as const;
