// GABS VOICE (2026-11): instant-reading templates and labels are Gabs's final copy.
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
  astro: "The astrological lens",
  psych: "The psychological lens",
  test: "Put it into practice",
} as const;

export const LAB_NOTE_LABEL = "A Lab note";
// DRAFT (2026-11-08) — Gabs to confirm: positive wording replaces "the chart is a prompt, not a cause".
export const STANCE_LINE = "astrology, read through a therapist's eyes";

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

/** Headline, e.g. "The Tower meets your Leo Sun". */
export function headline(card: Card, sunName: string): string {
  return `${card.name} meets your ${sunName} Sun`;
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
      `There's an interesting overlap here: in the Golden Dawn tradition, ${card.name} corresponds to ${card.attribution}, which is your own ${rel.with}` +
      ` sign. You may have reached for a theme that already feels familiar. Ask yourself: are you looking for confirmation of what you know, or a new way to work with it?`
    );
  }
  if (rel.kind === "agree") {
    return `Your ${sunName} Sun and this card point in a similar direction. The useful question may not be what you want, but what needs to shift for you to act on it.`;
  }
  return `This card introduces a different perspective from your ${sunName} Sun. That contrast is worth exploring: what might you be reaching for that doesn't come naturally to your usual way of operating?`;
}

/**
 * Second paragraph: tradition link, Sun baseline, then the relation sentence.
 * @param card the drawn card
 * @param sun the Sun sign record
 * @param relation the relationText output
 */
export function traditionParagraph(card: Card, sun: SignInfo, relation: string): string {
  return `In the Golden Dawn tradition, ${card.name} is associated with ${card.attribution} (${attributionKind(card)}). Your Sun in ${sun.name} ${sun.baseline}. Read together, they offer two perspectives on what may be taking up space in your life right now. ${relation}`;
}

/**
 * Moon paragraph. One name gives the single line, two names the ambiguous one.
 * @param moonNames one or two Moon sign names, in order of movement
 * @param moon the sign record for the first name
 */
export function moonLine(moonNames: readonly string[], moon: SignInfo): string {
  if (moonNames.length > 1) {
    return `Your Moon was moving from ${moonNames[0]} into ${moonNames[1]} around your birth. Since the Moon sign is linked to emotional needs and responses, your exact birth time helps us determine which interpretation applies.`;
  }
  return `With your Moon in ${moon.name}, ${moon.settle}. Notice how this card's theme meets the way you tend to respond when you need emotional grounding.`;
}

/** Note shown when the Sun sign changes across the birth day. @param first the sign the reading uses */
export function cuspNote(first: string): string {
  return `You were born close to a sign change, so this reading uses ${first} as a starting point. Your full profile can confirm the sign using your exact birth time and place.`;
}

/** Chip text for a position that may be ambiguous, e.g. "Leo or Virgo". */
export function signChip(names: readonly string[]): string {
  return names.join(" or ");
}
