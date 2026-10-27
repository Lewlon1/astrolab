// DRAFT — Gabs to rewrite in her voice
// The 22 major arcana. Wording is copied from the prototype; `attribution` is the Golden Dawn correspondence.
export type Element = "fire" | "earth" | "air" | "water";
export type ThemeKey = "visible" | "control" | "structure" | "give" | "explore" | "endings" | "belong" | "intuit";

export type Card = {
  n: number;
  numeral: string;
  name: string;
  /** Golden Dawn correspondence: a planet, the Moon, the Sun or a zodiac sign. */
  attribution: string;
  element: Element;
  theme: ThemeKey;
  /** The "what you're reaching for right now" opening line. */
  now: string;
  /** Which SVG motif the card face uses (sun for visible/explore themes, as in the prototype). */
  motif: "sun" | "star";
};

export const CARDS: readonly Card[] = [
  { n: 0, numeral: "0", name: "The Fool", attribution: "Uranus", element: "air", theme: "explore", now: "Something in you wants to step off the edge without the full map.", motif: "sun" },
  { n: 1, numeral: "I", name: "The Magician", attribution: "Mercury", element: "air", theme: "control", now: "You're reaching for agency: the sense that you can make something happen with what's already on the table.", motif: "star" },
  { n: 2, numeral: "II", name: "The High Priestess", attribution: "the Moon", element: "water", theme: "intuit", now: "You're drawn to what you know but can't yet explain.", motif: "star" },
  { n: 3, numeral: "III", name: "The Empress", attribution: "Venus", element: "earth", theme: "give", now: "You're reaching for nourishment, either giving it or finally letting yourself have it.", motif: "star" },
  { n: 4, numeral: "IV", name: "The Emperor", attribution: "Aries", element: "fire", theme: "structure", now: "Part of you wants order, a frame that holds when everything else moves.", motif: "star" },
  { n: 5, numeral: "V", name: "The Hierophant", attribution: "Taurus", element: "earth", theme: "belong", now: "You're drawn to tradition and to the people who share your way of seeing.", motif: "star" },
  { n: 6, numeral: "VI", name: "The Lovers", attribution: "Gemini", element: "air", theme: "belong", now: "There's a choice about closeness in front of you, and the card asks what you value, not only who you want.", motif: "star" },
  { n: 7, numeral: "VII", name: "The Chariot", attribution: "Cancer", element: "water", theme: "structure", now: "You want direction and momentum, and you're looking for the discipline to hold two opposing pulls together.", motif: "star" },
  { n: 8, numeral: "VIII", name: "Strength", attribution: "Leo", element: "fire", theme: "control", now: "The strength you're reaching for is the gentle kind: steadiness rather than force.", motif: "star" },
  { n: 9, numeral: "IX", name: "The Hermit", attribution: "Virgo", element: "earth", theme: "visible", now: "Part of you wants to step back, go quiet and think.", motif: "sun" },
  { n: 10, numeral: "X", name: "Wheel of Fortune", attribution: "Jupiter", element: "fire", theme: "explore", now: "You're drawn to change you didn't fully choose, and to whether you can ride it.", motif: "sun" },
  { n: 11, numeral: "XI", name: "Justice", attribution: "Libra", element: "air", theme: "give", now: "Something feels out of balance and you want it weighed fairly.", motif: "star" },
  { n: 12, numeral: "XII", name: "The Hanged Man", attribution: "Neptune", element: "water", theme: "control", now: "You're drawn to pausing, to letting something hang instead of forcing a resolution.", motif: "star" },
  { n: 13, numeral: "XIII", name: "Death", attribution: "Scorpio", element: "water", theme: "endings", now: "Something is finishing, and part of you already knows it.", motif: "star" },
  { n: 14, numeral: "XIV", name: "Temperance", attribution: "Sagittarius", element: "fire", theme: "give", now: "You're looking for the middle way: blending, pacing, not all or nothing.", motif: "star" },
  { n: 15, numeral: "XV", name: "The Devil", attribution: "Capricorn", element: "earth", theme: "structure", now: "You're drawn to look at what holds you, and at how loose the chains really are.", motif: "star" },
  { n: 16, numeral: "XVI", name: "The Tower", attribution: "Mars", element: "fire", theme: "endings", now: "Something you built on a shaky assumption wants to come down.", motif: "star" },
  { n: 17, numeral: "XVII", name: "The Star", attribution: "Aquarius", element: "air", theme: "visible", now: "You're reaching for hope, and for being seen as you are rather than as you perform.", motif: "sun" },
  { n: 18, numeral: "XVIII", name: "The Moon", attribution: "Pisces", element: "water", theme: "intuit", now: "You're in a fog and drawn to trust the instinct that's guiding you through it.", motif: "star" },
  { n: 19, numeral: "XIX", name: "The Sun", attribution: "the Sun", element: "fire", theme: "visible", now: "Part of you wants to be fully visible, warm and unhidden.", motif: "sun" },
  { n: 20, numeral: "XX", name: "Judgement", attribution: "Pluto", element: "water", theme: "endings", now: "Something from your past is asking to be reckoned with, not buried.", motif: "star" },
  { n: 21, numeral: "XXI", name: "The World", attribution: "Saturn", element: "earth", theme: "explore", now: "You're drawn to completion, the end of a long cycle and the open space after it.", motif: "sun" },
];
