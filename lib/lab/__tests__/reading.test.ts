import { describe, expect, it } from "vitest";
import { composeReading } from "../reading";
import { fakeChart } from "./helpers";

describe("composeReading", () => {
  it("mirror: card attribution equals the Sun sign", () => {
    // Strength is Leo
    const r = composeReading("Strength", fakeChart({ sun: "Leo", moon: "Pisces" }));
    expect(r.headline).toBe("Strength meets your Leo Sun");
    expect(r.paragraphs[0]).toEqual({
      kind: "open",
      text: "The strength you're reaching for may be quieter than you expect: patience, emotional steadiness and the ability to respond without forcing an outcome.",
    });
    expect(r.paragraphs[1].text).toBe(
      "In the Golden Dawn tradition, Strength is associated with Leo (a sign). Your Sun in Leo wants to create, express itself and feel that its presence matters. Read together, they offer two perspectives on what may be taking up space in your life right now. There's an interesting overlap here: in the Golden Dawn tradition, Strength corresponds to Leo, which is your own Sun sign. You may have reached for a theme that already feels familiar. Ask yourself: are you looking for confirmation of what you know, or a new way to work with it?"
    );
    expect(r.paragraphs[2].text).toBe(
      "With your Moon in Pisces, you settle through quiet, imagination, music or time near water. Notice how this card's theme meets the way you tend to respond when you need emotional grounding."
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
    expect(r.paragraphs[1].text).toContain("Your Gemini Sun and this card point in a similar direction.");
  });

  it("tension otherwise", () => {
    // Emperor: fire vs Taurus Sun (earth)
    const r = composeReading("The Emperor", fakeChart({ sun: "Taurus", moon: "Pisces" }));
    expect(r.paragraphs[1].text).toContain("This card introduces a different perspective from your Taurus Sun.");
  });

  it("ambiguous Sun uses the first sign and adds a cusp note", () => {
    const r = composeReading(
      "The Emperor",
      fakeChart({ sun: "Leo", moon: "Pisces", ambiguous: { Sun: ["Leo", "Virgo"] } })
    );
    expect(r.headline).toBe("The Emperor meets your Leo Sun");
    expect(r.cuspNote).toBe(
      "You were born close to a sign change, so this reading uses Leo as a starting point. Your full profile can confirm the sign using your exact birth time and place."
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
      "Your Moon was moving from Gemini into Cancer around your birth. Since the Moon sign is linked to emotional needs and responses, your exact birth time helps us determine which interpretation applies."
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
