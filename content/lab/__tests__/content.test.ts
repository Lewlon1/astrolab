import { readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { CARDS } from "../cards";
import { SIGNS, COMPATIBLE_ELEMENT, elementOf } from "../signs";
import { THEMES } from "../themes";
import { KEYWORDS, PLACEMENTS, PLACEMENT_TITLES } from "../placements";
import {
  TRANSIT_ASPECTS,
  TRANSIT_PLANETS,
  TRANSIT_POINTS,
  transitCopy,
} from "../transits";
import {
  cuspNote,
  headline,
  moonLine,
  relationOf,
  relationText,
  signInfo,
  traditionParagraph,
} from "../reading";
import * as privacy from "../privacy";
import * as ui from "../ui";

const dir = path.join(__dirname, "..");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe("cards", () => {
  it("has 22 cards with unique n from 0 to 21", () => {
    expect(CARDS).toHaveLength(22);
    expect(CARDS.map((c) => c.n).sort((a, b) => a - b)).toEqual(Array.from({ length: 22 }, (_, i) => i));
  });
  it("every theme exists and motif follows the theme", () => {
    for (const c of CARDS) {
      expect(THEMES[c.theme]).toBeDefined();
      expect(c.motif).toBe(c.theme === "visible" || c.theme === "explore" ? "sun" : "star");
    }
  });
  it("has 8 themes with full layers", () => {
    expect(Object.keys(THEMES)).toHaveLength(8);
    for (const [k, t] of Object.entries(THEMES)) {
      expect(t.key).toBe(k);
      expect(t.title && t.astro && t.psych && t.test).toBeTruthy();
    }
  });
});

describe("signs", () => {
  it("has 12 signs and element helpers", () => {
    expect(SIGNS).toHaveLength(12);
    expect(elementOf("Leo")).toBe("fire");
    expect(elementOf("The Fool")).toBeUndefined();
    expect(COMPATIBLE_ELEMENT.fire).toBe("air");
    expect(COMPATIBLE_ELEMENT.water).toBe("earth");
  });
});

describe("placements", () => {
  it("has all 6 x 12 entries, non-empty", () => {
    const keys = Object.keys(PLACEMENTS);
    expect(keys).toHaveLength(6);
    for (const k of keys) {
      const row = PLACEMENTS[k as keyof typeof PLACEMENTS];
      for (const s of SIGNS) {
        const e = row[s.name];
        expect(e.astro.length).toBeGreaterThan(10);
        expect(e.psych.length).toBeGreaterThan(10);
        expect(e.test.length).toBeGreaterThan(10);
      }
    }
  });
  it("keywords are complete", () => {
    expect(Object.keys(KEYWORDS)).toHaveLength(6);
    for (const row of Object.values(KEYWORDS)) {
      for (const s of SIGNS) expect(row[s.name]).toBeTruthy();
    }
    expect(PLACEMENT_TITLES.NorthNode).toBe("North Node");
  });
});

describe("transits", () => {
  it("returns non-empty copy for all 5 x 4 x 5 combinations", () => {
    let n = 0;
    for (const p of TRANSIT_PLANETS)
      for (const a of TRANSIT_ASPECTS)
        for (const pt of TRANSIT_POINTS) {
          const c = transitCopy(p, a, pt);
          for (const v of Object.values(c)) expect(v.length).toBeGreaterThan(5);
          n++;
        }
    expect(n).toBe(100);
    expect(transitCopy("Saturn", "square", "Sun").headline).toBe("Saturn squares your Sun");
  });
});

describe("reading templates", () => {
  const card = (name: string) => CARDS.find((c) => c.name === name)!;
  it("reproduces the prototype sentences", () => {
    expect(headline(card("The Tower"), "Leo")).toBe("The Tower meets a Leo Sun");
    expect(cuspNote("Leo")).toBe(
      "You were born on the cusp. The reading uses Leo. Your full profile settles it from your exact time and place.",
    );
    expect(moonLine(["Aries", "Taurus"], signInfo("Aries")!)).toBe(
      "Your Moon was moving from Aries into Taurus around your birth. One of those describes how you settle under stress, and your exact birth time decides which.",
    );
    expect(moonLine(["Cancer"], signInfo("Cancer")!)).toBe(
      "With your Moon in Cancer, you settle when home feels safe. Notice whether the pull of this card makes that harder or easier right now.",
    );
  });
  it("classifies relations", () => {
    expect(relationOf(card("Strength"), "Leo", "Aries")).toEqual({ kind: "mirror", with: "Sun" });
    expect(relationOf(card("Strength"), "Aries", "Leo")).toEqual({ kind: "mirror", with: "Moon" });
    expect(relationOf(card("Strength"), "Gemini", "Aries")).toEqual({ kind: "agree" });
    expect(relationOf(card("Strength"), "Taurus", "Aries")).toEqual({ kind: "tension" });
  });
  it("builds the tradition paragraph", () => {
    const c = card("Strength");
    const sun = signInfo("Gemini")!;
    const rel = relationText({ kind: "agree" }, { card: c, sunName: "Gemini" });
    expect(traditionParagraph(c, sun, rel)).toBe(
      "In the Golden Dawn tradition, Strength is linked to Leo (a sign). Your Sun in Gemini needs variety and thinks by talking. " + rel,
    );
    expect(traditionParagraph(card("The Tower"), sun, rel)).toContain("Mars (a planet)");
  });
});

describe("privacy", () => {
  it("has the version and consent link label", () => {
    expect(privacy.CONSENT_TEXT_VERSION).toBe("2026-10-24.v1");
    expect(privacy.CONSENT_TEXT.linkLabel).toBe("Privacy notice");
    expect(privacy.LAB_PRIVACY_SECTION.items.length).toBeGreaterThanOrEqual(5);
  });
  it("has the place-not-found error verbatim", () => {
    expect(ui.ERRORS.placeNotFound).toBe("We couldn't find that place. Try city and country.");
  });
});

describe("all content files", () => {
  it("every file starts with the DRAFT header", () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const f of files) {
      const first = readFileSync(path.join(dir, f), "utf8").split("\n")[0];
      expect(first, f).toBe("// DRAFT — Gabs to rewrite in her voice");
    }
  });
  it("contains no causal phrasing", () => {
    const all = [
      ...strings(CARDS), ...strings(SIGNS), ...strings(THEMES), ...strings(PLACEMENTS), ...strings(KEYWORDS),
      ...strings(privacy.LAB_PRIVACY_SECTION), ...strings(ui),
    ];
    for (const p of TRANSIT_PLANETS)
      for (const a of TRANSIT_ASPECTS)
        for (const pt of TRANSIT_POINTS) all.push(...strings(transitCopy(p, a, pt)));
    for (const s of all) expect(s).not.toMatch(/\bwill (make|cause|force) you\b/i);
  });
});
