import { describe, expect, it } from "vitest";
import { SIGNS, degreeInSign, signOf, signsOverWindow } from "@/lib/astro/signs";

describe("signs", () => {
  it("lists the 12 signs in zodiac order", () => {
    expect(SIGNS).toHaveLength(12);
    expect(SIGNS[0]).toBe("Aries");
    expect(SIGNS[11]).toBe("Pisces");
  });

  it("signOf and degreeInSign handle boundaries and wrap-around", () => {
    expect(signOf(0)).toBe("Aries");
    expect(signOf(29.999)).toBe("Aries");
    expect(signOf(30)).toBe("Taurus");
    expect(signOf(359.9)).toBe("Pisces");
    expect(signOf(360)).toBe("Aries");
    expect(signOf(-1)).toBe("Pisces");
    expect(degreeInSign(45.5)).toBeCloseTo(15.5, 10);
    expect(degreeInSign(-1)).toBeCloseTo(29, 10);
  });

  it("signsOverWindow returns distinct signs in order", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T10:00:00Z");
    // Longitude climbs 1°/h from 25°: Aries until 05:00, Taurus after.
    const fn = (d: Date) => 25 + (d.getTime() - start.getTime()) / 3600_000;
    expect(signsOverWindow(fn, start, end)).toEqual(["Aries", "Taurus"]);
  });

  it("signsOverWindow catches a change only visible at the endpoint", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date(start.getTime() + 90 * 60_000);
    const fn = (d: Date) => (d.getTime() >= end.getTime() ? 30.1 : 29.5);
    expect(signsOverWindow(fn, start, end)).toEqual(["Aries", "Taurus"]);
  });

  it("signsOverWindow returns one sign when nothing changes", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T23:59:00Z");
    expect(signsOverWindow(() => 100, start, end)).toEqual(["Cancer"]);
  });
});
