// Pure display helpers for /admin/bookings.

import type { Booking } from "@/lib/payments/types";

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function paymentSummary(b: Booking): string {
  if (b.payment_status === "unpaid") return "Unpaid";
  if (b.payment_status === "manual") {
    return b.payment_method_note ? `Paid manually · ${b.payment_method_note}` : "Paid manually";
  }
  const currency = b.currency ?? "eur";
  let text = b.amount_paid_cents !== null ? formatMoney(b.amount_paid_cents, currency) : "Paid";
  if (b.promo_code) {
    text += ` · ${b.promo_code}`;
    if (b.discount_cents) text += ` (−${formatMoney(b.discount_cents, currency)})`;
  }
  return text;
}

export function needsAttention(b: Booking): boolean {
  if (b.cal_uid === null) return true; // unmatched payment
  if (b.confirm_error) return true;
  return b.cal_status === "pending";
}

export function isUpcoming(b: Booking, now: Date = new Date()): boolean {
  if (!b.start_time) return false;
  if (b.cal_status === "cancelled" || b.cal_status === "rejected") return false;
  return new Date(b.start_time).getTime() >= now.getTime();
}
