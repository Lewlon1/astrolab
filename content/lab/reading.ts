// DRAFT — Gabs to rewrite in her voice
// Sentence templates for the instant reading. Each is a function so the sentence
// is rebuilt exactly as the prototype built it. The chart is a prompt, not a cause.
import type { Card } from "./cards";
import { COMPATIBLE_ELEMENT, elementOf, SIGNS } from "./signs";
import type { SignInfo } from "./signs";

export type Relation =
  | { kind: "mirror"; with: "Sun" | "Moon" }
  | { kind: "agree" }
  | { kind: "tension" };

/** Section labels for the three-layer lab note. */
export const LAYER_LABELS = {
  astro: "What astrology says",
  psych: "What psychology studies",
  test: "Test it this month",
} as const;

export const LAB_NOTE_LABEL = "Lab note";
export const STANCE_LINE = "the chart is a prompt, not a cause";

/** Look up a sign record by name. */
export function signInfo(name: string): SignInfo | undefined {
  return SIGNS.find((s) => s.name === name);
}

/**
 * How the drawn card relates to the chart.
 * @param card the drawn card
 * @param sunName Sun sign name (the primary sign if the Sun is on a cusp)
 * @param moonName Moon sign name (the primary sign if ambiguous)
 */
export function relationOf(card: Card, sunName: string, moonName: string): Relation {
  if (card.attribution === sunName) return { kind: "mirror", with: "Sun" };
  if (card.attribution === moonName) return { kind: "mirror", with: "Moon" };
  const sunElement = elementOf(sunName);
  if (sunElement && (card.element === sunElement || COMPATIBLE_ELEMENT[card.element] === sunElement)) {
    return { kind: "agree" };
  }
  return { kind: "tension" };
}

/** Headline, e.g. "The Tower meets a Leo Sun". */
export function headline(card: Card, sunName: string): string {
  return `${card.name} meets a ${sunName} Sun`;
}

/** Opening line: the card's "what you're reaching for" sentence. */
export function openingLine(card: Card): string {
  return card.now;
}

/** "a sign" when the attribution is a zodiac sign, otherwise "a planet" (as in the prototype). */
export function attributionKind(card: Card): "a sign" | "a planet" {
  return elementOf(card.attribution) ? "a sign" : "a planet";
}

/**
 * Mirror, agree or tension sentence.
 * @param rel result of relationOf
 * @param ctx card and the Sun sign name
 */
export function relationText(rel: Relation, ctx: { card: Card; sunName: string }): string {
  const { card, sunName } = ctx;
  if (rel.kind === "mirror") {
    return (
      `This one is unusual. In the Golden Dawn tradition ${card.name} corresponds to ${card.attribution}, which is your own ${rel.with}` +
      ` sign. You reached for something that already describes you. It's worth asking whether you're looking for permission rather than direction.`
    );
  }
  if (rel.kind === "agree") {
    return `The card and your ${sunName} Sun pull the same way. When that happens, the useful question is less what you want and more what's stopping you from doing it.`;
  }
  return `The card pulls against your ${sunName} Sun. That tension is the interesting part: something in you is reaching for what your usual way of operating doesn't easily allow.`;
}

/**
 * Second paragraph: tradition link, Sun baseline, then the relation sentence.
 * @param card the drawn card
 * @param sun the Sun sign record
 * @param relation the relationText output
 */
export function traditionParagraph(card: Card, sun: SignInfo, relation: string): string {
  return `In the Golden Dawn tradition, ${card.name} is linked to ${card.attribution} (${attributionKind(card)}). Your Sun in ${sun.name} ${sun.baseline}. ${relation}`;
}

/**
 * Moon paragraph. One name gives the single line, two names the ambiguous one.
 * @param moonNames one or two Moon sign names, in order of movement
 * @param moon the sign record for the first name
 */
export function moonLine(moonNames: readonly string[], moon: SignInfo): string {
  if (moonNames.length > 1) {
    return `Your Moon was moving from ${moonNames[0]} into ${moonNames[1]} around your birth. One of those describes how you settle under stress, and your exact birth time decides which.`;
  }
  return `With your Moon in ${moon.name}, ${moon.settle}. Notice whether the pull of this card makes that harder or easier right now.`;
}

/** Note shown when the Sun sign changes across the birth day. @param first the sign the reading uses */
export function cuspNote(first: string): string {
  return `You were born on the cusp. The reading uses ${first}. Your full profile settles it from your exact time and place.`;
}

/** Chip text for a position that may be ambiguous, e.g. "Leo or Virgo". */
export function signChip(names: readonly string[]): string {
  return names.join(" or ");
}
