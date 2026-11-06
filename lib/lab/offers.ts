// Server-only by convention. The paid sessions shown on the Lab profile: name,
// price and booking link from the `services` table, framing from content/lab/offers.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import { LAB_OFFERS, type LabOfferRole } from "@/content/lab/offers";
import type { Service } from "@/types";

export type LabOffer = {
  slug: string;
  role: LabOfferRole;
  name: string;
  priceLabel: string | null;
  href: string;
  /** Unfilled template: {card} is filled where it is shown. */
  pitch: string;
};

export const LAB_OFFER_SLUGS: readonly string[] = LAB_OFFERS.map((o) => o.slug);

/**
 * Active offers in LAB_OFFERS order. Rows that are missing, inactive or have no
 * booking link are dropped. Never throws: on any error it returns [] and the
 * page falls back to the generic booking link.
 */
export async function loadLabOffers(admin: SupabaseClient): Promise<LabOffer[]> {
  try {
    const { data, error } = await admin
      .from("services")
      .select("slug, name, price_label, booking_url, is_active")
      .in("slug", LAB_OFFER_SLUGS as string[])
      .eq("is_active", true);
    if (error || !Array.isArray(data)) {
      if (error) console.error("[lab] offers lookup failed, code", error.code);
      return [];
    }
    const rows = data as Pick<Service, "slug" | "name" | "price_label" | "booking_url" | "is_active">[];
    return LAB_OFFERS.flatMap((o) => {
      const row = rows.find((r) => r.slug === o.slug && r.is_active);
      if (!row || !row.booking_url) return [];
      return [{ slug: o.slug, role: o.role, name: row.name, priceLabel: row.price_label ?? null, href: row.booking_url, pitch: o.pitch }];
    });
  } catch {
    console.error("[lab] offers lookup failed");
    return [];
  }
}
