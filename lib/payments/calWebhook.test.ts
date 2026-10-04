import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCalEvent, verifyCalSignature } from "@/lib/payments/calWebhook";

const SECRET = "whsec_cal_test";
const sign = (body: string) =>
  createHmac("sha256", SECRET).update(body).digest("hex");

const requested = {
  triggerEvent: "BOOKING_REQUESTED",
  createdAt: "2026-10-04T10:00:00.000Z",
  payload: {
    uid: "cal_uid_1",
    type: "stellar-insights",
    eventTypeId: 42,
    startTime: "2026-10-10T09:00:00.000Z",
    endTime: "2026-10-10T10:00:00.000Z",
    status: "PENDING",
    attendees: [{ name: "Ada", email: "ada@example.com" }],
  },
};

describe("verifyCalSignature", () => {
  const body = JSON.stringify(requested);

  it("accepts a correct HMAC-SHA256 hex signature", () => {
    expect(verifyCalSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a wrong or missing signature", () => {
    expect(verifyCalSignature(body, sign(body + "x"), SECRET)).toBe(false);
    expect(verifyCalSignature(body, "short", SECRET)).toBe(false);
    expect(verifyCalSignature(body, null, SECRET)).toBe(false);
  });
});

describe("parseCalEvent", () => {
  it("parses BOOKING_REQUESTED as pending", () => {
    expect(parseCalEvent(requested)).toEqual({
      trigger: "BOOKING_REQUESTED",
      uid: "cal_uid_1",
      previousUid: null,
      serviceSlug: "stellar-insights",
      eventTypeId: 42,
      attendeeName: "Ada",
      attendeeEmail: "ada@example.com",
      startTime: "2026-10-10T09:00:00.000Z",
      endTime: "2026-10-10T10:00:00.000Z",
      calStatus: "pending",
    });
  });

  it("maps cancelled / rejected / created triggers", () => {
    const at = (trigger: string) =>
      parseCalEvent({ ...requested, triggerEvent: trigger })?.calStatus;
    expect(at("BOOKING_CANCELLED")).toBe("cancelled");
    expect(at("BOOKING_REJECTED")).toBe("rejected");
    expect(at("BOOKING_CREATED")).toBe("accepted");
  });

  it("reads rescheduleUid and payload status on reschedule", () => {
    const ev = parseCalEvent({
      triggerEvent: "BOOKING_RESCHEDULED",
      payload: { ...requested.payload, uid: "cal_uid_2", rescheduleUid: "cal_uid_1", status: "ACCEPTED" },
    });
    expect(ev?.uid).toBe("cal_uid_2");
    expect(ev?.previousUid).toBe("cal_uid_1");
    expect(ev?.calStatus).toBe("accepted");
  });

  it("returns null for unhandled triggers, missing uid, or junk", () => {
    expect(parseCalEvent({ ...requested, triggerEvent: "MEETING_ENDED" })).toBeNull();
    expect(parseCalEvent({ triggerEvent: "BOOKING_REQUESTED", payload: {} })).toBeNull();
    expect(parseCalEvent("nope")).toBeNull();
    expect(parseCalEvent(null)).toBeNull();
  });
});
