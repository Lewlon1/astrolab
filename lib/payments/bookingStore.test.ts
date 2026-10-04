import { describe, expect, it, vi } from "vitest";
import { memoryRepo } from "@/lib/payments/memoryRepo";
import {
  BookingActionError,
  confirmById,
  confirmInCal,
  declineBooking,
  linkPayment,
  markPaidManually,
  recordCalEvent,
  recordPayment,
} from "@/lib/payments/bookingStore";
import type { CalApi, CalBookingEvent, PaymentInfo } from "@/lib/payments/types";

const calEvent = (over: Partial<CalBookingEvent> = {}): CalBookingEvent => ({
  trigger: "BOOKING_REQUESTED",
  uid: "u1",
  previousUid: null,
  serviceSlug: "stellar-insights",
  eventTypeId: 42,
  attendeeName: "Ada",
  attendeeEmail: "ada@example.com",
  startTime: "2026-10-10T09:00:00.000Z",
  endTime: "2026-10-10T10:00:00.000Z",
  calStatus: "pending",
  ...over,
});

const payment = (over: Partial<PaymentInfo> = {}): PaymentInfo => ({
  calUid: "u1",
  stripeSessionId: "cs_1",
  paid: true,
  isBookingPayment: true,
  amountCents: 5400,
  currency: "eur",
  promoCode: "SPRING20",
  discountCents: 1100,
  email: "ada@example.com",
  name: "Ada",
  ...over,
});

const okCal = (): CalApi & { confirm: ReturnType<typeof vi.fn>; decline: ReturnType<typeof vi.fn> } => ({
  confirm: vi.fn().mockResolvedValue(undefined),
  decline: vi.fn().mockResolvedValue(undefined),
});

describe("recordCalEvent", () => {
  it("inserts a pending, unpaid booking", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    expect(b).toMatchObject({
      cal_uid: "u1",
      service_slug: "stellar-insights",
      attendee_email: "ada@example.com",
      cal_status: "pending",
      payment_status: "unpaid",
    });
    expect(repo.rows).toHaveLength(1);
  });

  it("does not downgrade a non-pending booking back to pending", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await repo.update(b.id, { cal_status: "accepted" });
    const again = await recordCalEvent(repo, calEvent());
    expect(again.cal_status).toBe("accepted");
  });

  it("applies cancellations", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    const b = await recordCalEvent(repo, calEvent({ trigger: "BOOKING_CANCELLED", calStatus: "cancelled" }));
    expect(b.cal_status).toBe("cancelled");
  });

  it("moves a rescheduled booking (and its payment) to the new uid", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    await recordPayment(repo, payment());
    const b = await recordCalEvent(
      repo,
      calEvent({ trigger: "BOOKING_RESCHEDULED", uid: "u2", previousUid: "u1", startTime: "2026-10-12T09:00:00.000Z", calStatus: "accepted" })
    );
    expect(repo.rows).toHaveLength(1);
    expect(b).toMatchObject({ cal_uid: "u2", start_time: "2026-10-12T09:00:00.000Z", payment_status: "paid" });
  });
});

describe("recordPayment", () => {
  it("marks an existing booking paid with promo details", async () => {
    const repo = memoryRepo();
    await recordCalEvent(repo, calEvent());
    const { booking, duplicate } = await recordPayment(repo, payment());
    expect(duplicate).toBe(false);
    expect(booking).toMatchObject({
      cal_uid: "u1",
      payment_status: "paid",
      stripe_session_id: "cs_1",
      amount_paid_cents: 5400,
      promo_code: "SPRING20",
      discount_cents: 1100,
    });
    expect(booking.paid_at).not.toBeNull();
  });

  it("creates the row when Stripe arrives before Cal, and Cal fills it in later", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment({ name: null }));
    const b = await recordCalEvent(repo, calEvent());
    expect(repo.rows).toHaveLength(1);
    expect(b).toMatchObject({ payment_status: "paid", attendee_name: "Ada", service_slug: "stellar-insights" });
  });

  it("is a no-op for a replayed session", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment());
    const again = await recordPayment(repo, payment());
    expect(again.duplicate).toBe(true);
    expect(repo.rows).toHaveLength(1);
  });

  it("records payments without a booking uid as unmatched", async () => {
    const repo = memoryRepo();
    const { booking } = await recordPayment(repo, payment({ calUid: null }));
    expect(booking.cal_uid).toBeNull();
    expect(booking.payment_status).toBe("paid");
  });

  it("records a second payment for an already-paid booking as unmatched", async () => {
    const repo = memoryRepo();
    await recordPayment(repo, payment());
    const { booking } = await recordPayment(repo, payment({ stripeSessionId: "cs_2" }));
    expect(booking.cal_uid).toBeNull();
    expect(repo.rows).toHaveLength(2);
  });
});

describe("confirmInCal", () => {
  it("confirms a pending booking and clears any old error", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    await repo.update(b.id, { confirm_error: "old" });
    const done = await confirmInCal(repo, cal, (await repo.findById(b.id))!);
    expect(cal.confirm).toHaveBeenCalledWith("u1");
    expect(done).toMatchObject({ cal_status: "accepted", confirm_error: null });
    expect(done.confirmed_at).not.toBeNull();
  });

  it("stores the error when Cal fails", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    cal.confirm.mockRejectedValue(new Error("Cal down"));
    const b = await recordCalEvent(repo, calEvent());
    const done = await confirmInCal(repo, cal, b);
    expect(done).toMatchObject({ cal_status: "pending", confirm_error: "Cal down" });
  });

  it("skips bookings that are not pending or have no uid", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent({ calStatus: "accepted", trigger: "BOOKING_CREATED" }));
    await confirmInCal(repo, cal, b);
    const { booking: unmatched } = await recordPayment(repo, payment({ calUid: null, stripeSessionId: "cs_9" }));
    await confirmInCal(repo, cal, unmatched);
    expect(cal.confirm).not.toHaveBeenCalled();
  });
});

describe("admin actions", () => {
  it("confirmById refuses unpaid bookings", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await expect(confirmById(repo, okCal(), b.id)).rejects.toBeInstanceOf(BookingActionError);
  });

  it("markPaidManually records the note and confirms", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const done = await markPaidManually(repo, cal, b.id, "bank transfer");
    expect(done).toMatchObject({ payment_status: "manual", payment_method_note: "bank transfer", cal_status: "accepted" });
    await expect(markPaidManually(repo, cal, b.id, "again")).rejects.toThrow(/already/);
  });

  it("declineBooking rejects in Cal and records it", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const done = await declineBooking(repo, cal, b.id, "No payment received");
    expect(cal.decline).toHaveBeenCalledWith("u1", "No payment received");
    expect(done.cal_status).toBe("rejected");
  });

  it("linkPayment moves an unmatched payment onto a booking and confirms", async () => {
    const repo = memoryRepo();
    const cal = okCal();
    const b = await recordCalEvent(repo, calEvent());
    const { booking: unmatched } = await recordPayment(repo, payment({ calUid: null }));
    const done = await linkPayment(repo, cal, unmatched.id, b.id);
    expect(repo.rows).toHaveLength(1);
    expect(done).toMatchObject({ id: b.id, payment_status: "paid", stripe_session_id: "cs_1", promo_code: "SPRING20", cal_status: "accepted" });
  });

  it("linkPayment refuses rows that aren't an unmatched payment + unpaid booking", async () => {
    const repo = memoryRepo();
    const b = await recordCalEvent(repo, calEvent());
    await expect(linkPayment(repo, okCal(), b.id, b.id)).rejects.toBeInstanceOf(BookingActionError);
  });

  it("throws a 404 BookingActionError for unknown ids", async () => {
    const err = await confirmById(memoryRepo(), okCal(), "nope").catch((e) => e);
    expect(err).toBeInstanceOf(BookingActionError);
    expect(err.status).toBe(404);
  });
});
