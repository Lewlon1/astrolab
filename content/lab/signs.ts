// DRAFT — Gabs to rewrite in her voice
import type { Sign } from "@/lib/astro";
import type { Element } from "./cards";

export type SignInfo = {
  name: Sign;
  element: Element;
  /** Completes "Your Sun in <sign> ...". */
  baseline: string;
  /** Completes "With your Moon in <sign>, ...". */
  settle: string;
};

export const SIGNS: readonly SignInfo[] = [
  { name: "Aries", element: "fire", baseline: "moves first and thinks on the way", settle: "you settle by doing something" },
  { name: "Taurus", element: "earth", baseline: "builds slowly and wants what lasts", settle: "you settle through the body: food, rest, touch, routine" },
  { name: "Gemini", element: "air", baseline: "needs variety and thinks by talking", settle: "you settle by putting feelings into words" },
  { name: "Cancer", element: "water", baseline: "protects what it loves and feels before it reasons", settle: "you settle when home feels safe" },
  { name: "Leo", element: "fire", baseline: "wants to create and to be recognised for it", settle: "you settle when someone sees you" },
  { name: "Virgo", element: "earth", baseline: "improves things and trusts what can be checked", settle: "you settle by putting something in order" },
  { name: "Libra", element: "air", baseline: "seeks balance and comes alive in relationship", settle: "you settle when things between people feel fair" },
  { name: "Scorpio", element: "water", baseline: "goes deep and wants the truth under the surface", settle: "you settle when you trust someone fully" },
  { name: "Sagittarius", element: "fire", baseline: "needs meaning and room to roam", settle: "you settle by moving, travelling or learning" },
  { name: "Capricorn", element: "earth", baseline: "takes the long view and earns its place", settle: "you settle when you're in control of the plan" },
  { name: "Aquarius", element: "air", baseline: "thinks independently and belongs on its own terms", settle: "you settle with space and a little distance" },
  { name: "Pisces", element: "water", baseline: "absorbs everything and feels the whole room", settle: "you settle through solitude, music or water" },
];

/** Elements that pull the same way: fire with air, earth with water. */
export const COMPATIBLE_ELEMENT: Record<Element, Element> = {
  fire: "air",
  air: "fire",
  earth: "water",
  water: "earth",
};

const ELEMENT_BY_NAME: Record<string, Element> = Object.fromEntries(
  SIGNS.map((x) => [x.name, x.element]),
);

/** Element of a zodiac sign name. Returns undefined for anything else (planets, the Moon, the Sun). */
export function elementOf(sign: string): Element | undefined {
  return ELEMENT_BY_NAME[sign];
}
