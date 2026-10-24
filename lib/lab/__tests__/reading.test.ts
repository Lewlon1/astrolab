import { describe, expect, it } from "vitest";
import { composeReading } from "../reading";
import { fakeChart } from "./helpers";

describe("composeReading", () => {
  it("mirror: card attribution equals the Sun sign", () => {
    // Strength is Leo
    const r = composeReading("Strength", fakeChart({ sun: "Leo", moon: "Pisces" }));
    expect(r.headline).toBe("Strength meets a Leo Sun");
    expect(r.paragraphs[0]).toEqual({
      kind: "open",
      text: "The strength you're reaching for is the gentle kind: steadiness rather than force.",
    });
    expect(r.paragraphs[1].text).toBe(
      "In the Golden Dawn tradition, Strength is linked to Leo (a sign). Your Sun in Leo wants to create and to be recognised for it. This one is unusual. In the Golden Dawn tradition Strength corresponds to Leo, which is your own Sun sign. You reached for something that already describes you. It's worth asking whether you're looking for permission rather than direction."
    );
    expect(r.paragraphs[2].text).toBe(
      "With your Moon in Pisces, you settle through solitude, music or water. Notice whether the pull of this card makes that harder or easier right now."
    );
    expect(r.cuspNote).toBeNull();
    expect(r.chips).toEqual([
      { label: "Card", value: "VIII · Strength" },
      { label: "Sun", value: "Leo" },
      { label: "Moon", value: "Pisces" },
    ]);
  });

  it("mirror on the Moon", () => {
    const r = composeReading("Strength", fakeChart({ sun: "Aries", moon: "Leo" }));
    expect(r.paragraphs[1].text).toContain("which is your own Moon sign");
  });

  it("agree: same or compatible element as the Sun", () => {
    // Emperor: fire. Gemini Sun is air (compatible with fire).
    const r = composeReading("The Emperor", fakeChart({ sun: "Gemini", moon: "Pisces" }));
    expect(r.paragraphs[1].text).toContain("The card and your Gemini Sun pull the same way.");
  });

  it("tension otherwise", () => {
    // Emperor: fire vs Taurus Sun (earth)
    const r = composeReading("The Emperor", fakeChart({ sun: "Taurus", moon: "Pisces" }));
    expect(r.paragraphs[1].text).toContain("The card pulls against your Taurus Sun.");
  });

  it("ambiguous Sun uses the first sign and adds a cusp note", () => {
    const r = composeReading(
      "The Emperor",
      fakeChart({ sun: "Leo", moon: "Pisces", ambiguous: { Sun: ["Leo", "Virgo"] } })
    );
    expect(r.headline).toBe("The Emperor meets a Leo Sun");
    expect(r.cuspNote).toBe(
      "You were born on the cusp. The reading uses Leo. Your full profile settles it from your exact time and place."
    );
    expect(r.chips[1].value).toBe("Leo or Virgo");
    expect(r.sun).toEqual(["Leo", "Virgo"]);
  });

  it("ambiguous Moon uses the 'X or Y' wording", () => {
    const r = composeReading(
      "The Emperor",
      fakeChart({ sun: "Leo", moon: "Gemini", ambiguous: { Moon: ["Gemini", "Cancer"] } })
    );
    expect(r.paragraphs[2].text).toBe(
      "Your Moon was moving from Gemini into Cancer around your birth. One of those describes how you settle under stress, and your exact birth time decides which."
    );
    expect(r.chips[2].value).toBe("Gemini or Cancer");
    expect(r.cuspNote).toBeNull();
  });

  it("carries the theme lab note, rising and zone flag", () => {
    const r = composeReading("The Hermit", fakeChart({ sun: "Leo", moon: "Pisces", hasTime: true }));
    expect(r.labNote.title).toBe("Visibility and withdrawal");
    expect(r.rising).toBe("Cancer");
  });

  it("rejects an unknown card", () => {
    expect(() => composeReading("Nope", fakeChart({ sun: "Leo", moon: "Leo" }))).toThrow();
  });
});
