import { describe, expect, it } from "vitest";
import { cleanFields, transitFieldsForMailerLite } from "../mailerlite";

describe("cleanFields", () => {
  it("drops null, undefined and empty values for ordinary fields", () => {
    expect(cleanFields({ lab_card: "", sun_sign: "Aries", moon_sign: undefined })).toEqual({ sun_sign: "Aries" });
  });

  it("keeps an empty transit field so a stale value is cleared", () => {
    expect(cleanFields({ next_transit: "", transit_peak_date: "" })).toEqual({ next_transit: "", transit_peak_date: "" });
  });

  it("still drops null transit fields (null means do not touch)", () => {
    expect(cleanFields({ next_transit: null, transit_peak_date: null })).toEqual({});
  });
});

describe("transitFieldsForMailerLite", () => {
  it("maps null to an empty string", () => {
    expect(transitFieldsForMailerLite({ next_transit: null, transit_peak_date: null })).toEqual({
      next_transit: "",
      transit_peak_date: "",
    });
  });
  it("passes values through", () => {
    expect(transitFieldsForMailerLite({ next_transit: "x", transit_peak_date: "2027-01-01" })).toEqual({
      next_transit: "x",
      transit_peak_date: "2027-01-01",
    });
  });
});
