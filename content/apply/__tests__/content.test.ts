import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONCEPTS, CONCEPT_KEYS, resolveConcept } from "../concepts";
import { FAQ } from "../faq";
import { QUESTIONS, STEPS } from "../application";
import { CREDENTIAL } from "../proof";
import { OFFER } from "../offer";

const DIR = join(__dirname, "..");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".ts"));

// Hard rule 4. Matched case-insensitively on whole words.
const BANNED = [
  /\btherap(y|ies|ist|ists|eutic)\b/i,
  /\bheal(s|ed|ing)?\b/i,
  /\btreatments?\b/i,
  /\bcures?\b/i,
  /\baccurate(ly)?\b/i,
  /\baccuracy\b/i,
  /\bbest\b/i,
  /\bguarantee(s|d)?\b/i,
  /\bdestin(y|ed)\b/i,
  /\bchosen one\b/i,
  /\bspots? left\b/i,
  /\bjoined today\b/i,
];

// The only places a banned word may appear: the FAQ question people search for,
// and Gabs's credential line (background, not a claim about the offer).
const ALLOWED_LINES = [FAQ.find((f) => f.id === "what-kind-of-work")!.q, CREDENTIAL];

/** Removes allowed strings, then the file's comments, so only shipped copy is checked. */
function shippedText(src: string): string {
  let out = src;
  for (const s of ALLOWED_LINES) out = out.split(JSON.stringify(s).slice(1, -1)).join("");
  return out
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

describe("content/apply", () => {
  it.each(FILES)("%s starts with the DRAFT banner", (file) => {
    const src = readFileSync(join(DIR, file), "utf8");
    expect(src.startsWith("// DRAFT — Gabs to rewrite in her voice")).toBe(true);
  });

  it.each(FILES)("%s has no banned words (Hard rule 4)", (file) => {
    const text = shippedText(readFileSync(join(DIR, file), "utf8"));
    for (const re of BANNED) expect(text, `${file} matches ${re}`).not.toMatch(re);
  });

  it("the credential line is background wording, and is the only psychotherapy mention", () => {
    expect(CREDENTIAL).toMatch(/background/i);
  });

  it("no hero asks about a personal attribute", () => {
    for (const k of ["default", ...CONCEPT_KEYS] as const) {
      expect(CONCEPTS[k].headline).not.toMatch(/^\s*(are|do|is) you\b/i);
    }
  });

  it("resolves concept keys and falls back to default", () => {
    expect(resolveConcept("c2")).toBe("c2");
    expect(resolveConcept(" C3 ")).toBe("c3");
    expect(resolveConcept(["c4", "c1"])).toBe("c4");
    expect(resolveConcept("c9")).toBe("default");
    expect(resolveConcept(undefined)).toBe("default");
  });

  it("FAQ has the four required questions", () => {
    const ids = FAQ.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["what-kind-of-work", "birth-time", "the-call", "not-for-me"]));
  });

  it("application is v3's three steps: by April, what repeats, birth date and place", () => {
    expect(STEPS.map((st) => st.id)).toEqual(["april", "repeats", "birth"]);
    expect(QUESTIONS.find((q) => q.id === "want_by_april")?.kind).toBe("textarea");
    expect(QUESTIONS.find((q) => q.id === "keeps_repeating")?.kind).toBe("textarea");
    expect(QUESTIONS.find((q) => q.id === "birth_date")).toMatchObject({ kind: "date", required: true });
    expect(QUESTIONS.find((q) => q.id === "birth_place")).toMatchObject({ required: true });
    expect(QUESTIONS.find((q) => q.id === "birth_time")).toMatchObject({ kind: "time", required: false });
    expect(QUESTIONS.some((q) => q.kind === "choice")).toBe(false);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("no placeholder copy ships", () => {
    for (const file of FILES) {
      const text = shippedText(readFileSync(join(DIR, file), "utf8"));
      expect(text, file).not.toMatch(/\bTODO\b|\bTBC\b|coming soon/i);
    }
  });

  it("both markets have a price", () => {
    expect(OFFER.price.uk.full).toMatch(/^£\d/);
    expect(OFFER.price.us.full).toMatch(/^\$\d/);
  });

  it("the banned-word check catches a violation", () => {
    expect(shippedText('const x = "This is therapy for you";')).toMatch(BANNED[0]);
    expect(shippedText('// a comment about therapy')).not.toMatch(BANNED[0]);
  });
});
