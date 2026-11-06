// GABS VOICE (2026-11): Sun and Moon sign lines are Gabs's final copy.
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
  { name: "Aries", element: "fire", baseline: "moves through life by initiating, taking risks and learning through action", settle: "you often settle by taking action and giving your feelings somewhere to go" },
  { name: "Taurus", element: "earth", baseline: "values consistency, builds at its own pace and looks for what has lasting value", settle: "you settle through the body: familiar routines, rest, food and physical comfort" },
  { name: "Gemini", element: "air", baseline: "makes sense of life through curiosity, conversation and changing perspectives", settle: "you settle by talking things through and finding language for what you're feeling" },
  { name: "Cancer", element: "water", baseline: "is guided by emotional connection, care and a strong sense of what feels like home", settle: "you settle when you feel emotionally safe, connected and able to let your guard down" },
  { name: "Leo", element: "fire", baseline: "wants to create, express itself and feel that its presence matters", settle: "you settle when you feel appreciated, seen and free to express yourself" },
  { name: "Virgo", element: "earth", baseline: "finds purpose in understanding, refining and making things work better", settle: "you settle by creating order, making sense of things and focusing on what you can do" },
  { name: "Libra", element: "air", baseline: "looks for balance, mutuality and a sense of self that can exist in relationship", settle: "you settle when your relationships feel balanced and there's room for honest exchange" },
  { name: "Scorpio", element: "water", baseline: "seeks depth, emotional honesty and what lies beneath the surface", settle: "you settle through emotional honesty, trust and the feeling that you don't have to hold everything back" },
  { name: "Sagittarius", element: "fire", baseline: "looks for meaning, possibility and the freedom to explore beyond the familiar", settle: "you settle through movement, perspective, learning and a sense of possibility" },
  { name: "Capricorn", element: "earth", baseline: "takes the long view, values competence and builds towards meaningful goals", settle: "you settle when you have a plan, a sense of direction and something you can rely on" },
  { name: "Aquarius", element: "air", baseline: "thinks independently, questions convention and defines belonging on its own terms", settle: "you settle with space to think, perspective and the freedom to process in your own way" },
  { name: "Pisces", element: "water", baseline: "is receptive to its surroundings, imaginative and sensitive to what isn't always said", settle: "you settle through quiet, imagination, music or time near water" },
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
