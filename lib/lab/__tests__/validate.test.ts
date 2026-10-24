import { describe, expect, it } from "vitest";
import { parseLabSrc, validateCompute, validateGate } from "../validate";

const now = new Date("2026-10-24T12:00:00Z");
const good = { date: "1990-05-17", time: "08:30", place: "London, UK", card: "The Tower", src: "bio" };

describe("validateCompute", () => {
  it("accepts a good body", () => {
    expect(validateCompute(good, now)).toEqual({ ok: true, value: { ...good } });
  });
  it("treats empty time as null and unknown src as null", () => {
    const r = validateCompute({ ...good, time: "", src: "weird" }, now);
    expect(r).toMatchObject({ ok: true, value: { time: null, src: null } });
  });
  it.each([
    [{ date: "" }, "date"],
    [{ date: "17/05/1990" }, "date"],
    [{ date: "1990-02-30" }, "date"],
    [{ date: "1899-12-31" }, "date"],
    [{ date: "2026-10-25" }, "date"],
    [{ time: "25:00" }, "time"],
    [{ time: "8:30" }, "time"],
    [{ place: "" }, "place"],
    [{ place: "x" }, "place"],
    [{ place: "x".repeat(121) }, "place"],
    [{ card: "The Wizard" }, "card"],
  ])("rejects %j", (patch, field) => {
    const r = validateCompute({ ...good, ...patch }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe(field);
      expect(r.message.length).toBeGreaterThan(5);
    }
  });
  it("accepts today and 1900-01-01", () => {
    expect(validateCompute({ ...good, date: "2026-10-24" }, now).ok).toBe(true);
    expect(validateCompute({ ...good, date: "1900-01-01" }, now).ok).toBe(true);
  });
  it("rejects non-object bodies", () => {
    expect(validateCompute(null, now).ok).toBe(false);
  });
});

describe("validateGate", () => {
  it("requires a valid email and lower-cases it", () => {
    expect(validateGate({ ...good, email: "Me@Example.com" }, now)).toMatchObject({
      ok: true,
      value: { email: "me@example.com" },
    });
    const bad = validateGate({ ...good, email: "nope" }, now);
    expect(bad).toMatchObject({ ok: false, field: "email" });
  });
});

describe("parseLabSrc", () => {
  it("accepts only the known sources", () => {
    for (const s of ["manychat", "bio", "ad", "lora"]) expect(parseLabSrc(s)).toBe(s);
    for (const s of ["", "BIO", "x", undefined, null, ["bio"], 1]) expect(parseLabSrc(s)).toBeNull();
  });
});
