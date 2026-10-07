// Booking/payment state transitions, shared by the Stripe + Cal webhooks and the
// admin actions. Every write is idempotent and order-independent: whichever
// webhook arrives first creates the row, the other fills it in.

import type {
  Booking,
  BookingFields,
  BookingPatch,
  BookingsRepo,
  CalApi,
  CalBookingEvent,
  PaymentInfo,
} from "@/lib/payments/types";

export class BookingActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "BookingActionError";
  }
}

const EMPTY: BookingFields = {
  cal_uid: null,
  service_slug: null,
  event_type_id: null,
  attendee_name: null,
  attendee_email: null,
  start_time: null,
  end_time: null,
  cal_status: "pending",
  payment_status: "unpaid",
  payment_method_note: null,
  stripe_session_id: null,
  amount_paid_cents: null,
  currency: null,
  promo_code: null,
  discount_cents: null,
  paid_at: null,
  confirmed_at: null,
  confirm_error: null,
};

const now = () => new Date().toISOString();
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

async function mustFind(repo: BookingsRepo, id: string): Promise<Booking> {
  const booking = await repo.findById(id);
  if (!booking) throw new BookingActionError("Booking not found", 404);
  return booking;
}

export async function recordCalEvent(
  repo: BookingsRepo,
  ev: CalBookingEvent
): Promise<Booking> {
  let existing = await repo.findByCalUid(ev.uid);
  // Reschedule: Cal issues a brand-new booking (new uid), so its status is authoritative.
  let rescheduled = false;
  if (!existing && ev.previousUid) {
    existing = await repo.findByCalUid(ev.previousUid);
    rescheduled = existing !== null;
  }

  const patch: BookingPatch = { cal_uid: ev.uid };
  if (ev.serviceSlug) patch.service_slug = ev.serviceSlug;
  if (ev.eventTypeId !== null) patch.event_type_id = ev.eventTypeId;
  if (ev.attendeeName) patch.attendee_name = ev.attendeeName;
  if (ev.attendeeEmail) patch.attendee_email = ev.attendeeEmail;
  if (ev.startTime) patch.start_time = ev.startTime;
  if (ev.endTime) patch.end_time = ev.endTime;

  // A late BOOKING_REQUESTED must never undo a confirm/cancel we already saw.
  const downgrade =
    !rescheduled && ev.calStatus === "pending" && existing && existing.cal_status !== "pending";
  if (ev.calStatus && !downgrade) patch.cal_status = ev.calStatus;
  // Cal confirmed it some other way: any earlier confirm failure is stale.
  if (patch.cal_status === "accepted") patch.confirm_error = null;

  if (existing) return repo.update(existing.id, patch);
  return repo.insert({ ...EMPTY, ...patch });
}

export async function recordPayment(
  repo: BookingsRepo,
  p: PaymentInfo
): Promise<{ booking: Booking; duplicate: boolean }> {
  const seen = await repo.findByStripeSession(p.stripeSessionId);
  if (seen) return { booking: seen, duplicate: true };

  const paid: BookingPatch = {
    payment_status: "paid",
    stripe_session_id: p.stripeSessionId,
    amount_paid_cents: p.amountCents,
    currency: p.currency,
    promo_code: p.promoCode,
    discount_cents: p.discountCents,
    paid_at: now(),
  };

  if (p.calUid) {
    const existing = await repo.findByCalUid(p.calUid);
    if (!existing) {
      const booking = await repo.insert({
        ...EMPTY,
        ...paid,
        cal_uid: p.calUid,
        attendee_name: p.name,
        attendee_email: p.email,
      });
      return { booking, duplicate: false };
    }
    if (existing.payment_status === "unpaid") {
      const booking = await repo.update(existing.id, {
        ...paid,
        attendee_name: existing.attendee_name ?? p.name,
        attendee_email: existing.attendee_email ?? p.email,
      });
      return { booking, duplicate: false };
    }
    // Already paid by another session → fall through so Gabs sees it.
  }

  const booking = await repo.insert({
    ...EMPTY,
    ...paid,
    attendee_name: p.name,
    attendee_email: p.email,
  });
  return { booking, duplicate: false };
}

export async function confirmInCal(
  repo: BookingsRepo,
  cal: CalApi,
  booking: Booking
): Promise<Booking> {
  if (!booking.cal_uid || booking.cal_status !== "pending") return booking;
  try {
    await cal.confirm(booking.cal_uid);
    return repo.update(booking.id, {
      cal_status: "accepted",
      confirmed_at: now(),
      confirm_error: null,
    });
  } catch (e) {
    return repo.update(booking.id, { confirm_error: message(e) });
  }
}

export async function confirmById(
  repo: BookingsRepo,
  cal: CalApi,
  id: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (booking.payment_status === "unpaid") {
    throw new BookingActionError("Booking is not paid yet");
  }
  return confirmInCal(repo, cal, booking);
}

export async function markPaidManually(
  repo: BookingsRepo,
  cal: CalApi,
  id: string,
  note: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (booking.payment_status !== "unpaid") {
    throw new BookingActionError("Booking is already paid");
  }
  const updated = await repo.update(id, {
    payment_status: "manual",
    payment_method_note: note,
    paid_at: now(),
  });
  return confirmInCal(repo, cal, updated);
}

export async function declineBooking(
  repo: BookingsRepo,
  cal: CalApi,
  id: string,
  reason?: string
): Promise<Booking> {
  const booking = await mustFind(repo, id);
  if (!booking.cal_uid || booking.cal_status !== "pending") {
    throw new BookingActionError("Only pending bookings can be declined");
  }
  await cal.decline(booking.cal_uid, reason);
  return repo.update(id, { cal_status: "rejected" });
}

export async function linkPayment(
  repo: BookingsRepo,
  cal: CalApi,
  paymentRowId: string,
  bookingId: string
): Promise<Booking> {
  const payment = await mustFind(repo, paymentRowId);
  const booking = await mustFind(repo, bookingId);
  if (payment.cal_uid !== null || !payment.stripe_session_id) {
    throw new BookingActionError("Source row is not an unmatched payment");
  }
  if (!booking.cal_uid || booking.payment_status !== "unpaid") {
    throw new BookingActionError("Target booking must be an unpaid Cal booking");
  }
  // Remove first: stripe_session_id is unique.
  await repo.remove(payment.id);
  const updated = await repo.update(booking.id, {
    payment_status: "paid",
    stripe_session_id: payment.stripe_session_id,
    amount_paid_cents: payment.amount_paid_cents,
    currency: payment.currency,
    promo_code: payment.promo_code,
    discount_cents: payment.discount_cents,
    paid_at: payment.paid_at,
  });
  return confirmInCal(repo, cal, updated);
}
