import { describe, expect, it } from "vitest";
import { buildProfileView, firstSentence } from "../profileView";
import { fakeChart, fakeRow } from "./helpers";

describe("buildProfileView", () => {
  it("without a time: no Rising, no houses, ambiguous shown as 'X or Y'", () => {
    const chart = fakeChart({ sun: "Leo", moon: "Gemini", ambiguous: { Moon: ["Gemini", "Cancer"] } });
    const v = buildProfileView(fakeRow(chart));
    expect(v.header).toEqual({ card: "The Tower", sun: "Leo", moon: "Gemini or Cancer", rising: null });
    expect(v.coreNotes.map((n) => n.key)).toEqual(["Sun", "Moon", "Venus", "Saturn", "NorthNode"]);
    const moon = v.coreNotes.find((n) => n.key === "Moon")!;
    expect(moon.title).toBe("Moon: Gemini or Cancer");
    expect(moon.note).toContain("Gemini");
    expect(moon.astro).toContain("The Moon in Gemini");
    expect(v.positions.every((p) => p.house === null)).toBe(true);
    const moonRow = v.positions.find((p) => p.body === "Moon")!;
    expect(moonRow.sign).toBe("Gemini or Cancer");
    expect(moonRow.degree).toBeNull();
    expect(v.positions.find((p) => p.body === "Sun")!.degree).toBe(14);
  });

  it("with a time: Rising and houses are present", () => {
    const v = buildProfileView(fakeRow(fakeChart({ sun: "Leo", moon: "Pisces", hasTime: true })));
    expect(v.header.rising).toBe("Cancer");
    expect(v.coreNotes).toHaveLength(6);
    expect(v.coreNotes[2].key).toBe("Rising");
    expect(v.positions.every((p) => p.house === 3)).toBe(true);
  });

  it("frames keywords as stance language", () => {
    const v = buildProfileView(fakeRow(fakeChart({ sun: "Leo", moon: "Pisces" })));
    const mercury = v.positions.find((p) => p.body === "Mercury")!;
    expect(mercury.keyword).toBe("Mercury in Aries is read as: thinks fast and speaks plainly.");
    expect(v.positions.find((p) => p.body === "Sun")!.keyword).toBeNull();
    const amb = buildProfileView(fakeRow(fakeChart({ sun: "Leo", moon: "Gemini", ambiguous: { Mercury: ["Aries", "Taurus"] } })));
    expect(amb.positions.find((p) => p.body === "Mercury")!.keyword).toBeNull();
  });

  it("floors degrees so 29.9 shows as 29", () => {
    const chart = fakeChart({ sun: "Leo", moon: "Pisces" });
    chart.positions.find((p) => p.body === "Sun")!.degree = 29.9;
    const v = buildProfileView(fakeRow(chart));
    expect(v.positions.find((p) => p.body === "Sun")!.degree).toBe(29);
  });

  describe("the card as a lens", () => {
    it("reads the big three through the card's theme (The Tower: endings)", () => {
      const v = buildProfileView(fakeRow(fakeChart({ sun: "Leo", moon: "Pisces", hasTime: true })));
      expect(v.lens?.theme.key).toBe("endings");
      expect(v.lens?.now).toMatch(/shaky assumption/);
      expect(v.lens?.chartQuestion).toContain("a Leo Sun with a Pisces Moon");
      expect(v.bigThree.map((b) => b.key)).toEqual(["Sun", "Moon", "Rising"]);
      const sun = v.bigThree[0];
      expect(sun.signLabel).toBe("Leo");
      expect(sun.essence).toBe(firstSentence(sun.note.astro));
      expect(sun.lensLine).toContain("Your Leo Sun");
      for (const s of [v.lens!.question, v.lens!.chartQuestion, ...v.bigThree.map((b) => b.lensLine)]) expect(s).not.toMatch(/\{\w+\}/);
    });

    it("without a time: Sun and Moon only, and an ambiguous Moon reads 'X or Y' with its note", () => {
      const chart = fakeChart({ sun: "Leo", moon: "Gemini", ambiguous: { Moon: ["Gemini", "Cancer"] } });
      const v = buildProfileView(fakeRow(chart));
      expect(v.bigThree.map((b) => b.key)).toEqual(["Sun", "Moon"]);
      const moon = v.bigThree[1];
      expect(moon.signLabel).toBe("Gemini or Cancer");
      expect(moon.lensLine).toContain("Your Gemini or Cancer Moon");
      expect(moon.note.note).toContain("Gemini");
    });

    it("an unknown card gives no lens and no lens lines, but keeps the placements", () => {
      const v = buildProfileView(fakeRow(fakeChart({ sun: "Leo", moon: "Pisces" }), "Not A Card"));
      expect(v.lens).toBeNull();
      expect(v.bigThree.map((b) => b.lensLine)).toEqual(["", ""]);
    });
  });

  it("firstSentence stops at the first sentence end", () => {
    expect(firstSentence("One thing. Two things.")).toBe("One thing.");
    expect(firstSentence("No full stop")).toBe("No full stop");
  });
});
