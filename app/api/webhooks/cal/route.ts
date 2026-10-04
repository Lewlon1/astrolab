/**
 * Cal.com webhook: keep the bookings table in sync with Cal (requested,
 * created, cancelled, rejected, rescheduled).
 *
 * Returns 500 on processing errors so Cal retries; the store is idempotent.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseCalEvent, verifyCalSignature } from "@/lib/payments/calWebhook";
import { recordCalEvent } from "@/lib/payments/bookingStore";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
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
    await recordCalEvent(supabaseBookingsRepo(createAdminClient()), event);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhooks/cal]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
