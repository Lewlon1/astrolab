/**
 * Stripe webhook: a pay-after-booking Payment Link was paid → record the
 * payment and confirm the Cal booking it references (client_reference_id).
 *
 * Returns 500 on processing errors so Stripe retries; the store is idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadPayment, stripe, verifyStripeEvent } from "@/lib/payments/stripePayment";
import { confirmInCal, recordPayment } from "@/lib/payments/bookingStore";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { calApi } from "@/lib/payments/calApi";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = verifyStripeEvent(stripe(), rawBody, req.headers.get("stripe-signature"), secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) return NextResponse.json({ received: true });

  try {
    const sessionId = (event.data.object as { id: string }).id;
    const payment = await loadPayment(stripe(), sessionId);
    // Quick Hit / Travel and other links aren't part of this flow.
    if (!payment.isBookingPayment || !payment.paid) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const repo = supabaseBookingsRepo(createAdminClient());
    const { booking, duplicate } = await recordPayment(repo, payment);
    if (!duplicate) await confirmInCal(repo, calApi(), booking);

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/stripe]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
