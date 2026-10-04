// Shared types for the pay-after-booking flow (Cal.com booking → Stripe payment
// → Cal confirm). See docs/superpowers/specs/2026-10-04-booking-payment-verification-design.md

export type CalStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "manual";

export interface Booking {
  id: string;
  /** null = a Stripe payment we couldn't match to a booking. */
  cal_uid: string | null;
  service_slug: string | null;
  event_type_id: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  start_time: string | null;
  end_time: string | null;
  cal_status: CalStatus;
  payment_status: PaymentStatus;
  payment_method_note: string | null;
  stripe_session_id: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  promo_code: string | null;
  discount_cents: number | null;
  paid_at: string | null;
  confirmed_at: string | null;
  confirm_error: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingFields = Omit<Booking, "id" | "created_at" | "updated_at">;
export type BookingPatch = Partial<BookingFields>;

export interface BookingsRepo {
  findById(id: string): Promise<Booking | null>;
  findByCalUid(uid: string): Promise<Booking | null>;
  findByStripeSession(sessionId: string): Promise<Booking | null>;
  insert(row: BookingFields): Promise<Booking>;
  update(id: string, patch: BookingPatch): Promise<Booking>;
  remove(id: string): Promise<void>;
}

export interface CalApi {
  confirm(uid: string): Promise<void>;
  decline(uid: string, reason?: string): Promise<void>;
}

/** A completed Stripe Checkout Session, reduced to what we store. */
export type PaymentInfo = {
  calUid: string | null;
  stripeSessionId: string;
  paid: boolean;
  /** true when the session came from a pay-after-booking Payment Link. */
  isBookingPayment: boolean;
  amountCents: number | null;
  currency: string | null;
  promoCode: string | null;
  discountCents: number | null;
  email: string | null;
  name: string | null;
};

/** A Cal.com webhook delivery, reduced to what we store. */
export type CalBookingEvent = {
  trigger: string;
  uid: string;
  /** Old uid when the booking was rescheduled (Cal issues a new uid). */
  previousUid: string | null;
  serviceSlug: string | null;
  eventTypeId: number | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  startTime: string | null;
  endTime: string | null;
  /** null = this trigger doesn't tell us the status. */
  calStatus: CalStatus | null;
};
