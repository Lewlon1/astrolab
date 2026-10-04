import { describe, expect, it } from "vitest";
import { formatMoney, isUpcoming, needsAttention, paymentSummary } from "@/lib/payments/bookingView";
import type { Booking } from "@/lib/payments/types";

const b = (over: Partial<Booking> = {}): Booking => ({
  id: "b1",
  cal_uid: "u1",
  service_slug: "stellar-insights",
  event_type_id: 42,
  attendee_name: "Ada",
  attendee_email: "ada@example.com",
  start_time: "2026-10-10T09:00:00.000Z",
  end_time: "2026-10-10T10:00:00.000Z",
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
  created_at: "2026-10-04T10:00:00.000Z",
  updated_at: "2026-10-04T10:00:00.000Z",
  ...over,
});

describe("formatMoney", () => {
  it("formats euro cents", () => {
    expect(formatMoney(5400, "eur")).toBe("€54.00");
  });
});

describe("paymentSummary", () => {
  it("covers unpaid, manual, paid and paid-with-promo", () => {
    expect(paymentSummary(b())).toBe("Unpaid");
    expect(paymentSummary(b({ payment_status: "manual", payment_method_note: "bank transfer" }))).toBe(
      "Paid manually · bank transfer"
    );
    expect(paymentSummary(b({ payment_status: "paid", amount_paid_cents: 12000, currency: "eur" }))).toBe("€120.00");
    expect(
      paymentSummary(
        b({ payment_status: "paid", amount_paid_cents: 5400, currency: "eur", promo_code: "SPRING20", discount_cents: 1100 })
      )
    ).toBe("€54.00 · SPRING20 (−€11.00)");
  });
});

describe("needsAttention", () => {
  it("flags pending, failed confirms and unmatched payments", () => {
    expect(needsAttention(b())).toBe(true);
    expect(needsAttention(b({ cal_status: "accepted" }))).toBe(false);
    expect(needsAttention(b({ cal_status: "pending", confirm_error: "x" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "accepted", confirm_error: "x" }))).toBe(false);
    expect(needsAttention(b({ cal_uid: null, cal_status: "pending", payment_status: "paid" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "cancelled" }))).toBe(false);
  });
});

describe("needsAttention (paid but dead booking)", () => {
  it("flags a payment on a rejected or cancelled booking", () => {
    expect(needsAttention(b({ cal_status: "rejected", payment_status: "paid" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "cancelled", payment_status: "paid" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "cancelled", payment_status: "manual" }))).toBe(true);
    expect(needsAttention(b({ cal_status: "rejected", payment_status: "unpaid" }))).toBe(false);
  });
});

describe("isUpcoming", () => {
  it("is true for future, non-cancelled sessions", () => {
    const now = new Date("2026-10-05T00:00:00.000Z");
    expect(isUpcoming(b({ cal_status: "accepted" }), now)).toBe(true);
    expect(isUpcoming(b({ cal_status: "cancelled" }), now)).toBe(false);
    expect(isUpcoming(b({ start_time: "2026-10-01T09:00:00.000Z" }), now)).toBe(false);
    expect(isUpcoming(b({ start_time: null }), now)).toBe(false);
  });
});
