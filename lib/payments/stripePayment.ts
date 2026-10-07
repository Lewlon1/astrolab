// Stripe helpers for the pay-after-booking flow (server-only).

import Stripe from "stripe";
import type { PaymentInfo } from "@/lib/payments/types";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export function verifyStripeEvent(
  api: Stripe,
  rawBody: string,
  signature: string | null,
  secret: string
): Stripe.Event {
  if (!signature) throw new Error("Missing stripe-signature header");
  return api.webhooks.constructEvent(rawBody, signature, secret);
}

/** The subset of the Stripe client loadPayment needs — lets tests pass a fake. */
export type StripeLike = {
  checkout: { sessions: Pick<Stripe.Checkout.SessionResource, "retrieve"> };
  promotionCodes: Pick<Stripe.PromotionCodeResource, "retrieve">;
};

// Loosely typed on purpose: discount shapes differ between Stripe API versions.
type DiscountLike = {
  amount?: number;
  discount?: {
    promotion_code?: string | { id?: string; code?: string } | null;
    coupon?: { name?: string | null } | null;
  } | null;
};

type SessionLike = {
  id: string;
  client_reference_id: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string> | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  total_details?: {
    amount_discount?: number;
    breakdown?: { discounts?: DiscountLike[] } | null;
  } | null;
};

async function promoCodeFor(
  api: StripeLike,
  discount: DiscountLike | undefined
): Promise<string | null> {
  const ref = discount?.discount?.promotion_code;
  if (typeof ref === "string") {
    const promo = await api.promotionCodes.retrieve(ref);
    return promo.code ?? null;
  }
  if (ref && typeof ref === "object" && ref.code) return ref.code;
  return discount?.discount?.coupon?.name ?? null;
}

export async function loadPayment(
  api: StripeLike,
  sessionId: string
): Promise<PaymentInfo> {
  const session = (await api.checkout.sessions.retrieve(sessionId, {
    expand: ["total_details.breakdown"],
  })) as unknown as SessionLike;

  const discounts = session.total_details?.breakdown?.discounts ?? [];
  const discountCents = session.total_details?.amount_discount || null;
  const calUid = session.client_reference_id || null;

  return {
    calUid,
    stripeSessionId: session.id,
    paid: session.payment_status === "paid",
    isBookingPayment: !!calUid || session.metadata?.booking_flow === "cal",
    amountCents: session.amount_total,
    currency: session.currency,
    promoCode: discounts.length ? await promoCodeFor(api, discounts[0]) : null,
    discountCents,
    email: session.customer_details?.email ?? null,
    name: session.customer_details?.name ?? null,
  };
}
