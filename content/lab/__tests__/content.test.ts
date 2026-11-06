import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { CARDS, cardImageSrc } from "../cards";
import { SIGNS, COMPATIBLE_ELEMENT, elementOf } from "../signs";
import { THEMES } from "../themes";
import { KEYWORDS, PLACEMENTS, PLACEMENT_TITLES } from "../placements";
import {
  POINT_SHORT,
  SEASON_NAMES,
  TRANSIT_ASPECTS,
  TRANSIT_PLANETS,
  TRANSIT_POINTS,
  transitCopy,
  transitTheme,
} from "../transits";
import { LENS, LENS_PLACEHOLDERS, lensText } from "../lens";
import { BIG_THREE } from "../bigThree";
import { LAB_OFFERS, OFFERS_UI } from "../offers";
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

describe("transit themes", () => {
  it("names every planet and point", () => {
    for (const p of TRANSIT_PLANETS) expect(SEASON_NAMES[p].length).toBeGreaterThan(3);
    for (const pt of TRANSIT_POINTS) expect(POINT_SHORT[pt].length).toBeGreaterThan(3);
    expect(transitTheme("Saturn", "Sun")).toBe("Testing what you've built · who you are");
  });
});

describe("card images", () => {
  it("every card has both image sizes on disk, named by its number", () => {
    for (const c of CARDS) {
      expect(c.image, c.name).toMatch(new RegExp(`^/lab/cards/${String(c.n).padStart(2, "0")}-[a-z-]+$`));
      for (const w of [240, 480] as const) {
        expect(existsSync(path.join(process.cwd(), "public", cardImageSrc(c, w))), `${c.name} ${w}`).toBe(true);
      }
    }
  });
  it("records a source for every image", () => {
    const sources = readFileSync(path.join(process.cwd(), "public/lab/cards/SOURCES.md"), "utf8");
    for (const c of CARDS) expect(sources, c.name).toContain(c.image.split("/").pop());
  });
});

describe("big three", () => {
  it("has an entry for every card, and nothing else", () => {
    expect(Object.keys(BIG_THREE).sort()).toEqual(CARDS.map((c) => c.name).sort());
  });
  it("uses only {sign} and {card}, and every placement line uses {sign}", () => {
    for (const [name, e] of Object.entries(BIG_THREE)) {
      for (const [k, v] of Object.entries(e)) {
        for (const ph of (v.match(/\{\w+\}/g) ?? []).map((m) => m.slice(1, -1))) expect(["sign", "card"], `${name}.${k}`).toContain(ph);
      }
      for (const k of ["Sun", "Moon", "Rising"] as const) expect(e[k], `${name}.${k}`).toContain("{sign}");
      expect(e.intro, name).toMatch(new RegExp(`^${name} speaks? to`));
      expect(e.reflection, name).toMatch(/\?$/);
    }
  });
  it("never puts 'a' straight before a sign placeholder (a Aries)", () => {
    for (const e of Object.values(BIG_THREE)) for (const v of Object.values(e)) expect(v).not.toMatch(/\b[Aa] \{sign\}/);
  });
});

describe("lensText", () => {
  it("uses 'an' before Aries and Aquarius", () => {
    expect(lensText("for a {sun} Sun with a {moon} Moon", { sun: "Aries", moon: "Aquarius" })).toBe("for an Aries Sun with an Aquarius Moon");
    expect(lensText("A {sign} Moon", { sign: "Aries or Taurus" })).toBe("An Aries or Taurus Moon");
    expect(lensText("a {sun} Sun", { sun: "Leo" })).toBe("a Leo Sun");
  });
});

describe("lens", () => {
  const themes = Object.keys(THEMES) as (keyof typeof LENS)[];
  it("has a question, a chart question and Sun/Moon/Rising lines for all 8 themes", () => {
    expect(Object.keys(LENS).sort()).toEqual([...themes].sort());
    for (const t of themes)
      for (const k of ["question", "chartQuestion", "Sun", "Moon", "Rising"] as const) expect(LENS[t][k].length, `${t}.${k}`).toBeGreaterThan(20);
  });
  it("uses only known placeholders, and placement lines name their sign", () => {
    for (const t of themes) {
      for (const v of Object.values(LENS[t])) {
        for (const name of (v.match(/\{\w+\}/g) ?? []).map((m) => m.slice(1, -1))) expect(LENS_PLACEHOLDERS as readonly string[]).toContain(name);
      }
      for (const k of ["Sun", "Moon", "Rising"] as const) expect(LENS[t][k]).toContain("{sign}");
    }
  });
  it("lensText fills placeholders and leaves unknown ones visible", () => {
    expect(lensText("{card} and {sign}", { card: "The Star", sign: "Leo" })).toBe("The Star and Leo");
    expect(lensText("{sun} and {other}", { sun: "Leo" })).toBe("Leo and {other}");
  });
});

describe("offers", () => {
  it("has exactly one primary offer and unique slugs", () => {
    expect(LAB_OFFERS.filter((o) => o.role === "primary")).toHaveLength(1);
    expect(new Set(LAB_OFFERS.map((o) => o.slug)).size).toBe(LAB_OFFERS.length);
  });
  it("labels buttons with the price when there is one", () => {
    expect(OFFERS_UI.book("Astro Psyche Blend", "65€")).toBe("Book Astro Psyche Blend · 65€");
    expect(OFFERS_UI.book("a session", null)).toBe("Book a session");
  });
});

describe("reading templates", () => {
  const card = (name: string) => CARDS.find((c) => c.name === name)!;
  it("reproduces the prototype sentences", () => {
    expect(headline(card("The Tower"), "Leo")).toBe("The Tower meets your Leo Sun");
    expect(cuspNote("Leo")).toBe(
      "You were born close to a sign change, so this reading uses Leo as a starting point. Your full profile can confirm the sign using your exact birth time and place.",
    );
    expect(moonLine(["Aries", "Taurus"], signInfo("Aries")!)).toBe(
      "Your Moon was moving from Aries into Taurus around your birth. Since the Moon sign is linked to emotional needs and responses, your exact birth time helps us determine which interpretation applies.",
    );
    expect(moonLine(["Cancer"], signInfo("Cancer")!)).toBe(
      "With your Moon in Cancer, you settle when you feel emotionally safe, connected and able to let your guard down. Notice how this card's theme meets the way you tend to respond when you need emotional grounding.",
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
      "In the Golden Dawn tradition, Strength is associated with Leo (a sign). Your Sun in Gemini makes sense of life through curiosity, conversation and changing perspectives. Read together, they offer two perspectives on what may be taking up space in your life right now. " + rel,
    );
    expect(traditionParagraph(card("The Tower"), sun, rel)).toContain("Mars (a planet)");
  });
});

describe("privacy", () => {
  it("has the version and consent link label", () => {
    expect(privacy.CONSENT_TEXT_VERSION).toBe("2026-10-25.v1");
    expect(privacy.CONSENT_TEXT.linkLabel).toBe("Privacy notice");
    expect(privacy.LAB_PRIVACY_SECTION.items.length).toBeGreaterThanOrEqual(5);
  });
  it("has the place-not-found error verbatim", () => {
    expect(ui.ERRORS.placeNotFound).toBe("We couldn't find that place. Try city and country.");
  });
});

describe("all content files", () => {
  it("every file starts with a DRAFT or GABS VOICE header", () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const f of files) {
      const first = readFileSync(path.join(dir, f), "utf8").split("\n")[0];
      expect(first, f).toMatch(/^\/\/ (DRAFT — Gabs to (rewrite in her voice|edit)|GABS VOICE \(2026-11\):)/);
    }
  });
  it("contains no causal phrasing", () => {
    const all = [
      ...strings(CARDS), ...strings(SIGNS), ...strings(THEMES), ...strings(PLACEMENTS), ...strings(KEYWORDS),
      ...strings(privacy.LAB_PRIVACY_SECTION), ...strings(ui), ...strings(LENS), ...strings(BIG_THREE), ...strings(LAB_OFFERS),
      ...strings(OFFERS_UI), ...strings(SEASON_NAMES), ...strings(POINT_SHORT),
    ];
    for (const p of TRANSIT_PLANETS)
      for (const a of TRANSIT_ASPECTS)
        for (const pt of TRANSIT_POINTS) all.push(...strings(transitCopy(p, a, pt)));
    for (const s of all) expect(s).not.toMatch(/\bwill (make|cause|force) you\b/i);
  });
});
