import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLabOffers } from "../offers";

const row = (slug: string, over: Record<string, unknown> = {}) => ({
  slug, name: slug.toUpperCase(), price_label: "€1", booking_url: `https://cal.com/${slug}`, is_active: true, ...over,
});

function fakeAdmin(result: { data?: unknown; error?: unknown; throws?: boolean }) {
  const q: Record<string, unknown> = {};
  q.select = () => q;
  q.in = () => q;
  q.eq = () =>
    result.throws ? Promise.reject(new Error("boom")) : Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
  return { from: () => q } as unknown as SupabaseClient;
}

describe("loadLabOffers", () => {
  it("returns the offers in LAB_OFFERS order with the primary first", async () => {
    const admin = fakeAdmin({ data: [row("stellar-insights"), row("cosmic-quick-hit"), row("astro-psyche-blend")] });
    const offers = await loadLabOffers(admin);
    expect(offers.map((o) => o.slug)).toEqual(["astro-psyche-blend", "cosmic-quick-hit", "stellar-insights"]);
    expect(offers[0]).toMatchObject({ role: "primary", name: "ASTRO-PSYCHE-BLEND", priceLabel: "€1", href: "https://cal.com/astro-psyche-blend" });
  });

  it("drops missing, inactive and link-less offers", async () => {
    const admin = fakeAdmin({ data: [row("astro-psyche-blend", { is_active: false }), row("cosmic-quick-hit", { booking_url: null })] });
    expect(await loadLabOffers(admin)).toEqual([]);
  });

  it("returns [] on a database error or a throw", async () => {
    expect(await loadLabOffers(fakeAdmin({ error: { code: "42P01" } }))).toEqual([]);
    expect(await loadLabOffers(fakeAdmin({ throws: true }))).toEqual([]);
  });
});
