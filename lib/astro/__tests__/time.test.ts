import { describe, expect, it } from "vitest";
import { AstroTimeError, localToUtc, zoneFor } from "@/lib/astro/time";

describe("time", () => {
  it("applies British Summer Time in July 1985", () => {
    const r = localToUtc("1985-07-01", "14:30", "Europe/London");
    expect(r.utc.toISOString()).toBe("1985-07-01T13:30:00.000Z");
    expect(r.approximateZone).toBe(false);
  });

  it("uses local noon with no time, and local day bounds", () => {
    const r = localToUtc("2024-01-15", null, "Europe/Madrid");
    expect(r.utc.toISOString()).toBe("2024-01-15T11:00:00.000Z");
    expect(r.dayStartUtc.toISOString()).toBe("2024-01-14T23:00:00.000Z");
    expect(r.dayEndUtc.toISOString()).toBe("2024-01-15T22:59:00.000Z");
  });

  it("flags pre-1970 dates as approximate", () => {
    expect(localToUtc("1960-03-10", "09:00", "Europe/London").approximateZone).toBe(true);
  });

  it("throws a typed error on an invalid zone or date", () => {
    expect(() => localToUtc("2024-01-15", "10:00", "Mars/Olympus")).toThrow(AstroTimeError);
    expect(() => localToUtc("2024-02-30", "10:00", "UTC")).toThrow(AstroTimeError);
    expect(() => localToUtc("2024-01-15", "25:00", "UTC")).toThrow(AstroTimeError);
    expect(() => localToUtc("15/01/2024", null, "UTC")).toThrow(AstroTimeError);
    try {
      localToUtc("2024-01-15", "10:00", "Mars/Olympus");
    } catch (e) {
      expect((e as AstroTimeError).code).toBe("INVALID_ZONE");
    }
  });

  it("zoneFor looks up IANA zones from coordinates", () => {
    expect(zoneFor(51.5, -0.13)).toBe("Europe/London");
    expect(zoneFor(41.39, 2.17)).toBe("Europe/Madrid");
  });
});
