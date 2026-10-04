/**
 * Cal.com webhook: keep the bookings table in sync with Cal (requested,
 * created, cancelled, rejected, rescheduled).
 *
 * Returns 500 on processing errors so Cal retries; the store is idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseCalEvent, verifyCalSignature } from "@/lib/payments/calWebhook";
import { confirmInCal, recordCalEvent } from "@/lib/payments/bookingStore";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { calApi } from "@/lib/payments/calApi";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  if (!verifyCalSignature(rawBody, req.headers.get("x-cal-signature-256"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseCalEvent(body);
  // Cal sends a PING when you save the webhook, plus triggers we don't track.
  if (!event) return NextResponse.json({ received: true, ignored: true });

  try {
    const repo = supabaseBookingsRepo(createAdminClient());
    const booking = await recordCalEvent(repo, event);
    // A paid booking rescheduled onto a requires-confirmation event comes back
    // pending in Cal: re-confirm it now that payment is already on file.
    if (booking.payment_status !== "unpaid" && booking.cal_status === "pending") {
      await confirmInCal(repo, calApi(), booking);
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/cal]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
