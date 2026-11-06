import { describe, expect, it } from "vitest";
import { buildProfileView } from "../profileView";
import { PREVIEW_DEFAULTS, parsePreviewParams, previewProfile } from "../preview";

const now = new Date("2026-10-27T12:00:00Z");

describe("parsePreviewParams", () => {
  it("uses the defaults for an empty query", () => {
    const p = parsePreviewParams({}, now);
    expect(p).toMatchObject({ card: PREVIEW_DEFAULTS.card, date: PREVIEW_DEFAULTS.date, time: "14:30", banner: false });
    expect(p.place.key).toBe("madrid");
  });

  it("reads a full query", () => {
    const p = parsePreviewParams({ card: "The Star", date: "1990-06-21", time: "08:05", place: "cdmx", banner: "1" }, now);
    expect(p).toMatchObject({ card: "The Star", date: "1990-06-21", time: "08:05", banner: true });
    expect(p.place.tz).toBe("America/Mexico_City");
  });

  it("an empty time means no birth time", () => {
    expect(parsePreviewParams({ time: "" }, now).time).toBeNull();
  });

  it("falls back on unknown or invalid values instead of failing", () => {
    const p = parsePreviewParams({ card: "Not A Card", date: "1990-02-30", place: "atlantis", time: "25:00" }, now);
    expect(p.card).toBe(PREVIEW_DEFAULTS.card);
    expect(p.date).toBe(PREVIEW_DEFAULTS.date);
    expect(p.place.key).toBe("madrid");
    expect(p.time).toBeNull();
    expect(parsePreviewParams({ date: "2027-01-01" }, now).date).toBe(PREVIEW_DEFAULTS.date);
    expect(parsePreviewParams({ date: "1899-12-31" }, now).date).toBe(PREVIEW_DEFAULTS.date);
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parsePreviewParams({ card: ["The Moon", "The Sun"] }, now).card).toBe("The Moon");
  });
});

describe("previewProfile", () => {
  it("builds a row the profile can render, with Rising only when there is a time", () => {
    const withTime = buildProfileView(previewProfile(parsePreviewParams({ card: "The Star" }, now)));
    expect(withTime.header.card).toBe("The Star");
    expect(withTime.bigThree.map((b) => b.key)).toEqual(["Sun", "Moon", "Rising"]);
    const noTime = buildProfileView(previewProfile(parsePreviewParams({ time: "" }, now)));
    expect(noTime.bigThree.map((b) => b.key)).toEqual(["Sun", "Moon"]);
  });

  it("a sign-change birthday reads 'X or Y' without a time", () => {
    const v = buildProfileView(previewProfile(parsePreviewParams({ date: "1990-06-21", time: "" }, now)));
    expect(v.header.sun).toBe("Gemini or Cancer");
  });

  it("works far north, where the house system falls back", () => {
    expect(() => previewProfile(parsePreviewParams({ place: "tromso", date: "1985-12-21", time: "03:00" }, now))).not.toThrow();
  });
});
