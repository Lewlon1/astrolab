import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  loadPayment,
  verifyStripeEvent,
  type StripeLike,
} from "@/lib/payments/stripePayment";

function fakeStripe(session: Record<string, unknown>, promoCode = "SPRING20") {
  const retrieveSession = vi.fn().mockResolvedValue(session);
  const retrievePromo = vi.fn().mockResolvedValue({ id: "promo_1", code: promoCode });
  const api = {
    checkout: { sessions: { retrieve: retrieveSession } },
    promotionCodes: { retrieve: retrievePromo },
  } as unknown as StripeLike;
  return { api, retrieveSession, retrievePromo };
}

const base = {
  id: "cs_test_1",
  client_reference_id: "cal_uid_1",
  payment_status: "paid",
  amount_total: 5400,
  currency: "eur",
  metadata: {},
  customer_details: { email: "ada@example.com", name: "Ada" },
  total_details: { amount_discount: 0, breakdown: { discounts: [] } },
};

describe("loadPayment", () => {
  it("expands the discount breakdown and maps a plain payment", async () => {
    const { api, retrieveSession } = fakeStripe(base);
    const p = await loadPayment(api, "cs_test_1");
    expect(retrieveSession).toHaveBeenCalledWith("cs_test_1", {
      expand: ["total_details.breakdown"],
    });
    expect(p).toEqual({
      calUid: "cal_uid_1",
      stripeSessionId: "cs_test_1",
      paid: true,
      isBookingPayment: true,
      amountCents: 5400,
      currency: "eur",
      promoCode: null,
      discountCents: null,
      email: "ada@example.com",
      name: "Ada",
    });
  });

  it("resolves the promotion code text and discount amount", async () => {
    const { api, retrievePromo } = fakeStripe({
      ...base,
      total_details: {
        amount_discount: 1100,
        breakdown: {
          discounts: [{ amount: 1100, discount: { promotion_code: "promo_1" } }],
        },
      },
    });
    const p = await loadPayment(api, "cs_test_1");
    expect(retrievePromo).toHaveBeenCalledWith("promo_1");
    expect(p.promoCode).toBe("SPRING20");
    expect(p.discountCents).toBe(1100);
  });

  it("falls back to the coupon name when no promotion code is attached", async () => {
    const { api, retrievePromo } = fakeStripe({
      ...base,
      total_details: {
        amount_discount: 500,
        breakdown: {
          discounts: [{ amount: 500, discount: { promotion_code: null, coupon: { name: "Friends" } } }],
        },
      },
    });
    const p = await loadPayment(api, "cs_test_1");
    expect(retrievePromo).not.toHaveBeenCalled();
    expect(p.promoCode).toBe("Friends");
  });

  it("flags booking payments by reference or metadata, and unpaid sessions", async () => {
    const plain = fakeStripe({ ...base, client_reference_id: null });
    expect((await loadPayment(plain.api, "cs")).isBookingPayment).toBe(false);

    const tagged = fakeStripe({ ...base, client_reference_id: null, metadata: { booking_flow: "cal" } });
    expect((await loadPayment(tagged.api, "cs")).isBookingPayment).toBe(true);

    const unpaid = fakeStripe({ ...base, payment_status: "unpaid" });
    expect((await loadPayment(unpaid.api, "cs")).paid).toBe(false);
  });
});

describe("verifyStripeEvent", () => {
  const client = new Stripe("sk_test_dummy");
  const secret = "whsec_test";
  const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test_1" } } });

  it("accepts a correctly signed payload", () => {
    const header = client.webhooks.generateTestHeaderString({ payload, secret });
    expect(verifyStripeEvent(client, payload, header, secret).id).toBe("evt_1");
  });

  it("throws on a bad or missing signature", () => {
    expect(() => verifyStripeEvent(client, payload, "t=1,v1=bad", secret)).toThrow();
    expect(() => verifyStripeEvent(client, payload, null, secret)).toThrow();
  });
});
