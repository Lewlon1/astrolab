// DRAFT — Gabs to rewrite in her voice
// The card as a lens on the chart. The drawn card names the theme closest to the
// surface right now (a projective choice), and the profile reads Sun, Moon and
// Rising through that theme. Every line is a prompt to notice, never a cause.
//
// Placeholders: {sign} (the placement's sign, or "X or Y"), {sun}, {moon}, {card}.
import type { ThemeKey } from "./cards";

export type LensEntry = {
  /** Open question under the card: what the pick may be pointing at. */
  question: string;
  Sun: string;
  Moon: string;
  Rising: string;
  /** Closes the chart section: the question a session works through. */
  chartQuestion: string;
};

export const LENS: Record<ThemeKey, LensEntry> = {
  visible: {
    question: "Where are you stepping forward right now, and where are you stepping back?",
    Sun: "Your {sign} Sun is read as how you want to be seen. Notice where you show this side of yourself this month, and where you keep it back.",
    Moon: "Your {sign} Moon is read as what helps you settle. Notice whether your time alone restores you or helps you avoid something.",
    Rising: "Your {sign} Rising is read as the face you lead with. Notice who gets to see past it, and who doesn't.",
    chartQuestion: "What does being seen look like for a {sun} Sun with a {moon} Moon, and what is the step back protecting? That is the conversation a session opens up.",
  },
  control: {
    question: "What are you holding tightly right now, and what would happen if you loosened your grip?",
    Sun: "Your {sign} Sun is read as how you take charge of your own life. Notice where taking charge has turned into managing everything.",
    Moon: "Your {sign} Moon is read as how you look after your feelings. Notice what you try to control when you feel unsettled.",
    Rising: "Your {sign} Rising is read as how you meet the unexpected in front of others. Notice the moment you reach for a plan.",
    chartQuestion: "Where does a {sun} Sun with a {moon} Moon hold on, and where could it let go? A session maps that with you, pattern by pattern.",
  },
  structure: {
    question: "Which rules in your life did you choose, and which did you inherit?",
    Sun: "Your {sign} Sun is read as what you build your sense of self around. Notice which of your routines feel like yours and which feel like a cage.",
    Moon: "Your {sign} Moon is read as the comfort you need. Notice whether structure calms you this month or makes you restless.",
    Rising: "Your {sign} Rising is read as how you meet rules and expectations. Notice when you go along on the outside and push back inside.",
    chartQuestion: "What would a structure that fits a {sun} Sun and a {moon} Moon actually look like? That is what a session helps you sketch.",
  },
  give: {
    question: "Where are you giving more than you take in, and how easy is it for you to receive?",
    Sun: "Your {sign} Sun is read as what you offer the world. Notice whether giving it feels like a choice or an obligation.",
    Moon: "Your {sign} Moon is read as how you like to be cared for. Notice whether you let anyone do it.",
    Rising: "Your {sign} Rising is read as how you come across to others. Notice whether people see you as the one who gives.",
    chartQuestion: "How does a {sun} Sun with a {moon} Moon give, and what makes receiving hard? A session works through where the exchange gets stuck.",
  },
  explore: {
    question: "What is pulling you towards the unfamiliar, and what is keeping you where you are?",
    Sun: "Your {sign} Sun is read as what makes you feel alive. Notice how much novelty it asks for, and whether your life is giving it any.",
    Moon: "Your {sign} Moon is read as what makes you feel safe. Notice how much change it can take before it wants to retreat.",
    Rising: "Your {sign} Rising is read as how you walk into new situations. Notice whether you lead with curiosity or with caution.",
    chartQuestion: "How much adventure does a {sun} Sun with a {moon} Moon actually want? A session helps you find the pace that suits you.",
  },
  endings: {
    question: "What is ending for you right now, and what is it making room for?",
    Sun: "Your {sign} Sun is read as who you are at the core. Notice which part of who you've been is ready to change form.",
    Moon: "Your {sign} Moon is read as what helps you settle. With endings in view, notice what you reach for when something closes.",
    Rising: "Your {sign} Rising is read as how you show up for others. Notice how you present an ending to people compared with how it feels inside.",
    chartQuestion: "What does a {sun} Sun with a {moon} Moon carry forward from an ending, and what does it need to set down? A session gives that question the time it needs.",
  },
  belong: {
    question: "Where do you feel you belong right now, and where do you need room to stand apart?",
    Sun: "Your {sign} Sun is read as what makes you, you. Notice where you feel free to show it and where you tone it down to fit in.",
    Moon: "Your {sign} Moon is read as what home feels like to you. Notice who and what gives you that feeling this month.",
    Rising: "Your {sign} Rising is read as how you enter a group. Notice whether you move closer or keep a little distance at first.",
    chartQuestion: "How does a {sun} Sun with a {moon} Moon balance closeness and independence? A session looks at the pattern behind it.",
  },
  intuit: {
    question: "Which decision is in front of you, and are you trusting your gut or your reasoning?",
    Sun: "Your {sign} Sun is read as how you make sense of your own life. Notice whether you explain your choices before you make them or after.",
    Moon: "Your {sign} Moon is read as your instinctive response. Notice what it says first, before you argue with it.",
    Rising: "Your {sign} Rising is read as your first read of a situation. Notice how often that first read turns out to be right.",
    chartQuestion: "When should a {sun} Sun with a {moon} Moon trust instinct, and when should it check the evidence? A session helps you tell the two apart.",
  },
};

export const LENS_PLACEHOLDERS = ["card", "sign", "sun", "moon"] as const;
type LensVar = (typeof LENS_PLACEHOLDERS)[number];

/** Fill `{name}` placeholders. Unknown or missing ones are left as they are, so tests can catch them. */
export function lensText(template: string, vars: Partial<Record<LensVar, string>>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars && vars[k as LensVar] ? vars[k as LensVar]! : m));
}
