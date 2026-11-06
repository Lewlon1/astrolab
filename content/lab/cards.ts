// GABS VOICE (2026-11): the `now` card lines are Gabs's final copy.
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
  /** Which SVG motif the card face uses (sun for visible/explore themes, as in the prototype). Fallback when the image fails. */
  motif: "sun" | "star";
  /** Base path of the 1909 RWS image; files are `${image}-240.webp` and `${image}-480.webp` (see public/lab/cards/SOURCES.md). */
  image: string;
};

/** The card image at a given width. */
export const cardImageSrc = (card: Pick<Card, "image">, width: 240 | 480) => `${card.image}-${width}.webp`;

export const CARDS: readonly Card[] = [
  { n: 0, numeral: "0", name: "The Fool", attribution: "Uranus", element: "air", theme: "explore", now: "You're drawn to a beginning, even if you can't see the whole path yet. There may be something to learn from letting curiosity lead before certainty catches up.", motif: "sun" , image: "/lab/cards/00-the-fool" },
  { n: 1, numeral: "I", name: "The Magician", attribution: "Mercury", element: "air", theme: "control", now: "You're reaching for agency: the feeling that you have more to work with than you think. The question is what happens when you stop waiting for the perfect conditions and use what's already in your hands.", motif: "star" , image: "/lab/cards/01-the-magician" },
  { n: 2, numeral: "II", name: "The High Priestess", attribution: "the Moon", element: "water", theme: "intuit", now: "You're drawn to what you sense but haven't quite put into words. There may be something worth listening to before you rush to explain it.", motif: "star" , image: "/lab/cards/02-the-high-priestess" },
  { n: 3, numeral: "III", name: "The Empress", attribution: "Venus", element: "earth", theme: "give", now: "You're reaching for nourishment, creativity and a little more room to receive. Notice where care flows naturally, and where you've made it something you have to earn.", motif: "star" , image: "/lab/cards/03-the-empress" },
  { n: 4, numeral: "IV", name: "The Emperor", attribution: "Aries", element: "fire", theme: "structure", now: "Part of you wants structure, clarity and something solid to lean on. The interesting question is whether the rules you're relying on are supporting you or keeping you in place.", motif: "star" , image: "/lab/cards/04-the-emperor" },
  { n: 5, numeral: "V", name: "The Hierophant", attribution: "Taurus", element: "earth", theme: "belong", now: "You're drawn to shared values, familiar structures and the wisdom of tradition. It's worth asking which beliefs genuinely belong to you, and which you've inherited without questioning.", motif: "star" , image: "/lab/cards/05-the-hierophant" },
  { n: 6, numeral: "VI", name: "The Lovers", attribution: "Gemini", element: "air", theme: "belong", now: "A choice about connection or commitment may be asking for your attention. Beyond attraction, this card brings you back to what you value and whether your choices reflect it.", motif: "star" , image: "/lab/cards/06-the-lovers" },
  { n: 7, numeral: "VII", name: "The Chariot", attribution: "Cancer", element: "water", theme: "structure", now: "You're looking for direction and momentum, perhaps while managing two competing priorities. Progress may depend less on choosing one side and more on learning how to work with both.", motif: "star" , image: "/lab/cards/07-the-chariot" },
  { n: 8, numeral: "VIII", name: "Strength", attribution: "Leo", element: "fire", theme: "control", now: "The strength you're reaching for may be quieter than you expect: patience, emotional steadiness and the ability to respond without forcing an outcome.", motif: "star" , image: "/lab/cards/08-strength" },
  { n: 9, numeral: "IX", name: "The Hermit", attribution: "Virgo", element: "earth", theme: "visible", now: "Part of you wants space to think, process and hear yourself again. Notice whether stepping back is helping you reconnect or making it easier to avoid what's waiting outside.", motif: "sun" , image: "/lab/cards/09-the-hermit" },
  { n: 10, numeral: "X", name: "Wheel of Fortune", attribution: "Jupiter", element: "fire", theme: "explore", now: "You're meeting change, including the parts you didn't plan for. The question isn't whether you can control every turn, but how you choose to respond when the familiar shifts.", motif: "sun" , image: "/lab/cards/10-wheel-of-fortune" },
  { n: 11, numeral: "XI", name: "Justice", attribution: "Libra", element: "air", theme: "give", now: "Something may feel out of balance, and you're looking for a clearer sense of what is fair. This card invites you to look at the facts, your part in the situation and what accountability might require.", motif: "star" , image: "/lab/cards/11-justice" },
  { n: 12, numeral: "XII", name: "The Hanged Man", attribution: "Neptune", element: "water", theme: "control", now: "You're drawn to pause rather than force an answer. A change in perspective may offer more than another attempt to make things happen on your timeline.", motif: "star" , image: "/lab/cards/12-the-hanged-man" },
  { n: 13, numeral: "XIII", name: "Death", attribution: "Scorpio", element: "water", theme: "endings", now: "Something may be reaching the end of its current form. Even when change is necessary, it's worth making space for what you're leaving behind.", motif: "star" , image: "/lab/cards/13-death" },
  { n: 14, numeral: "XIV", name: "Temperance", attribution: "Sagittarius", element: "fire", theme: "give", now: "You're looking for a more sustainable rhythm: less all-or-nothing, more integration. Sometimes the work is learning how different parts of your life can coexist.", motif: "star" , image: "/lab/cards/14-temperance" },
  { n: 15, numeral: "XV", name: "The Devil", attribution: "Capricorn", element: "earth", theme: "structure", now: "You're being invited to look at the patterns, attachments or habits that have a hold on you. What feels like a lack of choice may be worth examining more closely.", motif: "star" , image: "/lab/cards/15-the-devil" },
  { n: 16, numeral: "XVI", name: "The Tower", attribution: "Mars", element: "fire", theme: "endings", now: "Something built on an assumption that no longer holds may be asking to be reconsidered. Disruption can be uncomfortable, but it can also reveal what was never as stable as it seemed.", motif: "star" , image: "/lab/cards/16-the-tower" },
  { n: 17, numeral: "XVII", name: "The Star", attribution: "Aquarius", element: "air", theme: "visible", now: "You're reaching for hope, renewal and the freedom to show up without performing. What might change if you allowed yourself to be seen as you are?", motif: "sun" , image: "/lab/cards/17-the-star" },
  { n: 18, numeral: "XVIII", name: "The Moon", attribution: "Pisces", element: "water", theme: "intuit", now: "Not everything feels clear right now, and uncertainty may be bringing old fears or assumptions to the surface. Notice the difference between intuition and the stories you tell yourself when you don't have all the information.", motif: "star" , image: "/lab/cards/18-the-moon" },
  { n: 19, numeral: "XIX", name: "The Sun", attribution: "the Sun", element: "fire", theme: "visible", now: "Part of you wants more openness, joy and room to take up space. Notice where you feel most like yourself, without needing to edit or minimise it.", motif: "sun" , image: "/lab/cards/19-the-sun" },
  { n: 20, numeral: "XX", name: "Judgement", attribution: "Pluto", element: "water", theme: "endings", now: "Something from your past may be asking for a different kind of attention. Rather than revisiting it to judge yourself, consider what you understand now that you couldn't see then.", motif: "star" , image: "/lab/cards/20-judgement" },
  { n: 21, numeral: "XXI", name: "The World", attribution: "Saturn", element: "earth", theme: "explore", now: "You're drawn to completion, integration and the feeling of reaching a meaningful milestone. Take stock of what this chapter has taught you before deciding what comes next.", motif: "sun" , image: "/lab/cards/21-the-world" },
];
