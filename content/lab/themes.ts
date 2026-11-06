// DRAFT — Gabs to rewrite in her voice
import type { ThemeKey } from "./cards";

export type Theme = {
  key: ThemeKey;
  title: string;
  /** What astrology says. */
  astro: string;
  /** What psychology studies. */
  psych: string;
  /** Test it this month: one concrete self-observation. */
  test: string;
};

export const THEMES: Record<ThemeKey, Theme> = {
  visible: {
    key: "visible",
    title: "Visibility and withdrawal",
    astro: "This axis shows up between the Sun, which is about being seen, and the 12th house and Neptune, which govern retreat and the parts of us that stay hidden.",
    psych: "Research on solitude separates chosen solitude, which tends to calm high-arousal feelings and restore people, from withdrawal driven by avoidance. The behaviour looks the same. The motive is what differs.",
    test: "Each time you step back from something this month, note whether you were moving toward rest or away from discomfort.",
  },
  control: {
    key: "control",
    title: "Control and surrender",
    astro: "Astrologers read this through Mars and Pluto, the drive to act on the world, set against Neptune and the 12th house, where things are let go.",
    psych: "Intolerance of uncertainty is linked in the research to worry and over-control. Acceptance-based therapies treat accepting what can't be controlled as a skill that improves with practice.",
    test: "Choose one situation you've been managing tightly and deliberately hand one decision to someone else.",
  },
  structure: {
    key: "structure",
    title: "Structure and freedom",
    astro: "Saturn, the planet of rules and limits, against Uranus, the planet of breaking out. Most charts carry some version of this argument.",
    psych: "Self-determination theory treats autonomy as a basic psychological need. Structure you chose tends to support it. Structure imposed on you tends to wear it down.",
    test: "Write down three rules you live by. For each one, ask whose rule it was in the first place.",
  },
  give: {
    key: "give",
    title: "Giving and receiving",
    astro: "Venus describes what we value and how we receive. Its houses show where the exchange flows easily and where it sticks.",
    psych: "Reciprocity research suggests relationships feel fair when giving balances out over time, and people who habitually over-give often find receiving uncomfortable.",
    test: "Accept one offer of help this month without paying it back straight away. Notice what that brings up.",
  },
  explore: {
    key: "explore",
    title: "Certainty and exploration",
    astro: "Jupiter expands and Uranus disrupts. Both push against the safety of what's already known.",
    psych: "Personality research shows people differ widely and fairly stably in openness to new experience. Neither end is better. Strain comes from a mismatch between your appetite for novelty and your circumstances.",
    test: "Do one small unfamiliar thing each week. Rate your discomfort from 1 to 10 before and after.",
  },
  endings: {
    key: "endings",
    title: "Endings and holding on",
    astro: "Pluto and the 8th house describe loss and transformation, the endings that make room for something else.",
    psych: "Grief research has moved away from 'letting go' toward continuing bonds: people often carry what ended into a new form rather than cutting it off.",
    test: "Name something that has already ended that you still act as if hasn't. What would carrying it forward look like instead?",
  },
  belong: {
    key: "belong",
    title: "Independence and belonging",
    astro: "The Moon and the 4th house describe where we feel we belong. Aquarius and Uranus describe the urge to stand apart.",
    psych: "Attachment research describes how early experience shapes the balance between closeness and independence, and shows adults can move toward more secure patterns over time.",
    test: "Notice when you pull back after getting close to someone. Write down what happened just before.",
  },
  intuit: {
    key: "intuit",
    title: "Intuition and evidence",
    astro: "The Moon and Neptune rule instinct and what can't be measured. Mercury rules what can be argued.",
    psych: "Research on expert intuition by Kahneman and Klein found gut feelings are reliable in settings with regular patterns and fast feedback, and unreliable almost everywhere else.",
    test: "Write down three gut calls this month before you act on them. Check how they turned out in four weeks.",
  },
};

export type { ThemeKey };
