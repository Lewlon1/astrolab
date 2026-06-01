// Central booking config. Booking + payment happen entirely inside Cal.com
// (Stripe app) or Stripe Payment Links — the site only renders buttons/links and
// never handles money. Nothing here touches Supabase.

export const CAL_USERNAME =
  process.env.NEXT_PUBLIC_CAL_USERNAME ?? "theastropsychelab";

export const calLink = (slug: string) => `${CAL_USERNAME}/${slug}`;

export const CAL_BRAND = "#C26B4A"; // sunset terracotta

export type BookingTarget =
  | { kind: "cal"; slug: string }
  | { kind: "stripe"; url: string };

export type ServiceMeta = {
  name: string;
  tarot: string;
  price: string;
  durationMin?: number;
  booking: BookingTarget;
};

// Stable service id -> showcase metadata + booking target.
export const SERVICES: Record<string, ServiceMeta> = {
  quickHit: {
    name: "Cosmic Quick Hit",
    tarot: "The Fool",
    price: "€25",
    booking: {
      kind: "stripe",
      url: "https://book.stripe.com/fZucN64mvcqpe3I1AU5wI01",
    },
  },
  blend: {
    name: "Astro Psyche Blend",
    tarot: "The Sun",
    price: "€65",
    durationMin: 45,
    booking: { kind: "cal", slug: "astro-psyche-blend" },
  },
  stellar: {
    name: "Stellar Insights",
    tarot: "The Star",
    price: "€120",
    durationMin: 60,
    booking: { kind: "cal", slug: "stellar-insights" },
  },
  alliance: {
    name: "Cosmic Alliance",
    tarot: "The Empress",
    price: "€180",
    durationMin: 90,
    booking: { kind: "cal", slug: "cosmic-alliance" },
  },
  travel: {
    name: "Soul Guided Travel Magazine",
    tarot: "Wheel of Fortune",
    price: "€75",
    booking: {
      kind: "stripe",
      url: "https://book.stripe.com/aFa14o6uDbml7Fkcfy5wI02",
    },
  },
} as const;

// Order used by the /book showcase grid (mirrors the tarot card order).
export const SERVICE_ORDER = [
  "quickHit",
  "blend",
  "stellar",
  "alliance",
  "travel",
] as const;

// Maps the existing DB / tarot-card slugs to the SERVICES keys above, so the
// showcase can resolve a booking target from the slug it already has.
const SLUG_TO_KEY: Record<string, keyof typeof SERVICES> = {
  "cosmic-quick-hit": "quickHit",
  "astro-psyche-blend": "blend",
  "stellar-insights": "stellar",
  "cosmic-alliance": "alliance",
  "soul-guided-travel-magazine": "travel",
};

export function bookingForSlug(slug: string): BookingTarget | null {
  const key = SLUG_TO_KEY[slug];
  return key ? SERVICES[key].booking : null;
}
