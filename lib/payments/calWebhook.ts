// Cal.com webhook helpers (server-only: uses node:crypto).
// Cal signs the raw body with HMAC-SHA256 (hex) in the X-Cal-Signature-256 header.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CalBookingEvent, CalStatus } from "@/lib/payments/types";

export function verifyCalSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8"
  );
  const given = Buffer.from(signature, "utf8");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const STATUS_BY_TRIGGER: Record<string, CalStatus | null> = {
  BOOKING_REQUESTED: "pending",
  BOOKING_CREATED: "accepted",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_REJECTED: "rejected",
  // Reschedules carry their status in the payload instead.
  BOOKING_RESCHEDULED: null,
};

const PAYLOAD_STATUS: Record<string, CalStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

export function parseCalEvent(body: unknown): CalBookingEvent | null {
  if (!body || typeof body !== "object") return null;
  const { triggerEvent, payload } = body as {
    triggerEvent?: unknown;
    payload?: Record<string, unknown>;
  };
  if (
    typeof triggerEvent !== "string" ||
    !Object.prototype.hasOwnProperty.call(STATUS_BY_TRIGGER, triggerEvent)
  ) {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const uid = str(payload.uid);
  if (!uid) return null;

  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const first = (attendees[0] ?? {}) as { name?: unknown; email?: unknown };

  const calStatus =
    STATUS_BY_TRIGGER[triggerEvent] ??
    PAYLOAD_STATUS[String(payload.status ?? "").toUpperCase()] ??
    null;

  return {
    trigger: triggerEvent,
    uid,
    previousUid: str(payload.rescheduleUid),
    serviceSlug: str(payload.type),
    eventTypeId: typeof payload.eventTypeId === "number" ? payload.eventTypeId : null,
    attendeeName: str(first.name),
    attendeeEmail: str(first.email),
    startTime: str(payload.startTime),
    endTime: str(payload.endTime),
    calStatus,
  };
}
