// Shared service helpers: CTA resolution + EN/ES localization.
// Used by the homepage services index, the /services page, and the
// admin form's live preview, so all three render identically.

import type { Lang } from "@/context/LangContext";
import type { Service } from "@/types";
import { bookingForSlug, type BookingTarget } from "@/lib/booking";

export type ServiceCta =
  // Hardcoded Cal.com/Stripe config for the original slugs (lib/booking.ts)
  | { kind: "booking"; target: BookingTarget }
  // Admin-pasted booking_url (Cal.com page link or Stripe Payment Link)
  | { kind: "external"; url: string }
  // Lead magnet → newsletter capture section
  | { kind: "lead" }
  // No booking target configured → CTA hidden
  | { kind: "none" };

export interface LocalizedService {
  id: string;
  slug: string;
  name: string;
  tag: string | null;
  priceLabel: string | null;
  duration: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  isFree: boolean;
  cta: ServiceCta;
}

// CTA labels per language. Centralised so the admin preview (which has no
// LangProvider) and the public pages render identical copy.
export const SERVICE_CARD_LABELS: Record<Lang, { book: string; free: string }> =
  {
    en: { book: "Book session", free: "Get yours free" },
    es: { book: "Reservar sesión", free: "Consíguelo gratis" },
  };

export function serviceCta(service: Service): ServiceCta {
  // Keyed off the EN tag column — it's the stable identifier; tag_es is
  // display-only.
  if (service.tag === "Lead magnet") return { kind: "lead" };

  const target = bookingForSlug(service.slug);
  if (target) return { kind: "booking", target };

  const url = service.booking_url?.trim();
  if (url) return { kind: "external", url };

  return { kind: "none" };
}

function pick(en: string | null | undefined, es: string | null | undefined, lang: Lang): string | null {
  if (lang === "es" && es?.trim()) return es;
  return en ?? null;
}

export function localizeService(service: Service, lang: Lang): LocalizedService {
  return {
    id: service.id,
    slug: service.slug,
    name: pick(service.name, service.name_es, lang) ?? service.name,
    tag: pick(service.tag, service.tag_es, lang),
    priceLabel: pick(service.price_label, service.price_label_es, lang),
    duration: pick(service.duration, service.duration_es, lang),
    shortDescription: pick(
      service.short_description,
      service.short_description_es,
      lang
    ),
    description: pick(service.description, service.description_es, lang),
    imageUrl: service.image_url ?? null,
    isFree: service.price === 0,
    cta: serviceCta(service),
  };
}
