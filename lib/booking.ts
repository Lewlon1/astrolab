// Central booking config. Booking + payment happen entirely inside Cal.com
// (Stripe app) or Stripe Payment Links — the site only renders buttons/links and
// never handles money. Nothing here touches Supabase.

export const CAL_USERNAME =
  process.env.NEXT_PUBLIC_CAL_USERNAME ?? "theastropsychelab";

export const calLink = (slug: string) => `${CAL_USERNAME}/${slug}`;

export const CAL_BRAND = "#C26B4A"; // sunset terracotta

export type BookingTarget =
  // paymentUrl: Stripe Payment Link the client is sent to after booking
  // (pay-after-booking flow). Set from services.payment_url via withPaymentUrl.
  // path: full Cal link ("user/event") for admin-pasted Cal URLs; when absent
  // the link is CAL_USERNAME/slug.
  | { kind: "cal"; slug: string; path?: string; paymentUrl?: string }
  | { kind: "stripe"; url: string };

export type CalTarget = Extract<BookingTarget, { kind: "cal" }>;

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

// Stripe Payment Link with the Cal booking uid attached, so the Stripe webhook
// can tie the payment back to the booking.
export function paymentLinkFor(paymentUrl: string, calUid: string): string {
  const url = new URL(paymentUrl);
  url.searchParams.set("client_reference_id", calUid);
  return url.toString();
}

// Attach a service's payment_url to a Cal booking target. Stripe targets and
// empty URLs pass through unchanged.
export function withPaymentUrl(
  target: BookingTarget | null,
  paymentUrl: string | null | undefined
): BookingTarget | null {
  const url = paymentUrl?.trim();
  if (!target || target.kind !== "cal" || !url) return target;
  return { ...target, paymentUrl: url };
}

const CAL_HOSTS = new Set(["cal.com", "www.cal.com", "app.cal.com"]);

// An admin-pasted cal.com event link (e.g. https://cal.com/user/event) as an
// embeddable Cal target, or null if it isn't one. Profile-only links
// (cal.com/user) are not events and return null.
export function calTargetFromUrl(raw: string | null | undefined): CalTarget | null {
  const value = raw?.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!CAL_HOSTS.has(url.hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  return { kind: "cal", slug: segments[segments.length - 1], path: segments.join("/") };
}

// The Cal embed link for a cal target.
export function calPathFor(target: CalTarget): string {
  return target.path ?? calLink(target.slug);
}
