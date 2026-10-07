/**
 * Admin actions on a booking: mark paid manually, confirm (retry), decline,
 * or link an unmatched Stripe payment to a booking.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseBookingsRepo } from "@/lib/payments/supabaseRepo";
import { calApi } from "@/lib/payments/calApi";
import {
  BookingActionError,
  confirmById,
  declineBooking,
  linkPayment,
  markPaidManually,
} from "@/lib/payments/bookingStore";
import type { Booking } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  const repo = supabaseBookingsRepo(createAdminClient());
  const cal = calApi();

  try {
    let booking: Booking;
    switch (action) {
      case "mark_paid": {
        const note = typeof body.note === "string" ? body.note.trim() : "";
        if (!note) {
          return NextResponse.json({ error: "A payment note is required" }, { status: 400 });
        }
        booking = await markPaidManually(repo, cal, params.id, note);
        break;
      }
      case "confirm":
        booking = await confirmById(repo, cal, params.id);
        break;
      case "decline":
        booking = await declineBooking(
          repo,
          cal,
          params.id,
          typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined
        );
        break;
      case "link":
        if (typeof body.bookingId !== "string") {
          return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
        }
        booking = await linkPayment(repo, cal, params.id, body.bookingId);
        break;
      default:
        return NextResponse.json(
          { error: 'action must be "mark_paid", "confirm", "decline" or "link"' },
          { status: 400 }
        );
    }
    return NextResponse.json({ booking });
  } catch (e) {
    if (e instanceof BookingActionError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[admin/bookings]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed" },
      { status: 500 }
    );
  }
}
