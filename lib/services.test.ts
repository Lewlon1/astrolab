import { describe, expect, it } from "vitest";
import { serviceCta } from "@/lib/services";
import type { Service } from "@/types";

const svc = (over: Partial<Service> = {}): Service => ({
  id: "s1",
  name: "Solar Return Session",
  slug: "solar-return-session",
  price: null,
  price_label: null,
  duration: null,
  description: null,
  short_description: null,
  tag: null,
  calendly_url: null,
  sort_order: 0,
  is_active: true,
  created_at: "",
  updated_at: "",
  booking_url: null,
  payment_url: null,
  ...over,
});

describe("serviceCta", () => {
  it("embeds an admin-pasted Cal link with pay-after-booking when a payment link is set", () => {
    expect(
      serviceCta(
        svc({
          booking_url: "https://cal.com/theastropsychelab/solar-return",
          payment_url: "https://buy.stripe.com/abc",
        })
      )
    ).toEqual({
      kind: "booking",
      target: {
        kind: "cal",
        slug: "solar-return",
        path: "theastropsychelab/solar-return",
        paymentUrl: "https://buy.stripe.com/abc",
      },
    });
  });

  it("keeps an admin-pasted Cal link as a new-tab link when no payment link is set", () => {
    expect(serviceCta(svc({ booking_url: "https://cal.com/theastropsychelab/solar-return" }))).toEqual({
      kind: "external",
      url: "https://cal.com/theastropsychelab/solar-return",
    });
  });

  it("keeps non-Cal booking links external even with a payment link", () => {
    expect(
      serviceCta(svc({ booking_url: "https://buy.stripe.com/x", payment_url: "https://buy.stripe.com/y" }))
    ).toEqual({ kind: "external", url: "https://buy.stripe.com/x" });
  });

  it("still prefers the built-in booking for the original slugs", () => {
    expect(
      serviceCta(
        svc({
          slug: "stellar-insights",
          booking_url: "https://cal.com/other/thing",
          payment_url: "https://buy.stripe.com/p",
        })
      )
    ).toEqual({
      kind: "booking",
      target: { kind: "cal", slug: "stellar-insights", paymentUrl: "https://buy.stripe.com/p" },
    });
  });

  it("hides the button when nothing is configured, and routes lead magnets", () => {
    expect(serviceCta(svc())).toEqual({ kind: "none" });
    expect(serviceCta(svc({ tag: "Lead magnet" }))).toEqual({ kind: "lead" });
  });
});
