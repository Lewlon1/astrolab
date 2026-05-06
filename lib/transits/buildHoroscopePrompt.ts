// 12-sign × Sun/Rising horoscope bundle prompt builder.
// Pure function — imported by both:
//   - app/api/transit-horoscope/route.ts  (server, calls Bedrock)
//   - components/admin/transits/HoroscopeModal.tsx  (client, "Copy Prompt" button)
// Do NOT add server-only imports.

import type { Transit, Language } from "./types";
import { SIGNS } from "./types";

const BRAND_VOICE = `You are a horoscope writer for The Astro Psyche Lab, an astrology + psychology brand run by Gabs in Barcelona. Her voice:
- Warm, insightful, never fluffy or generic
- Specific and slightly provocative — never lukewarm "today is a good day for self-care"
- Blends astrological knowledge with psychological depth (attachment theory, somatic awareness, cognitive patterns)
- Always ties insights back to recognisable, lived patterns — not abstract horoscope-speak`;

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: "Each `content` field is one English paragraph (60-80 words).",
  es: "Each `content` field is one Spanish paragraph (60-80 words). Warm, conversational, Barcelona-natural — don't translate, write natively.",
  both:
    "Each `content` field contains BOTH languages, formatted exactly as: `EN: <english 60-80 word paragraph>\\n\\nES: <spanish 60-80 word paragraph>`. Don't translate word-for-word — adapt naturally for each language.",
};

export interface BuildHoroscopePromptInput {
  transit: Transit;
  language: Language;
  /** When true, append a stricter no-preamble reminder. Used by API retry. */
  strict?: boolean;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildHoroscopePrompt(
  input: BuildHoroscopePromptInput
): BuiltPrompt {
  const { transit, language, strict = false } = input;

  const orderedPairs = SIGNS.flatMap((sign) =>
    [`{ "sign": "${sign}", "placement": "sun", "content": "..." }`, `{ "sign": "${sign}", "placement": "rising", "content": "..." }`]
  ).join(",\n    ");

  const system = `${BRAND_VOICE}

You're writing a 24-read horoscope bundle for ONE specific transit: 12 signs × 2 placements (Sun and Rising).

VOICE GUIDELINES per read
- Open with what THIS transit means for THAT specific sign+placement
- Sun reads = identity, life direction, what's being illuminated about who they are
- Rising reads = how they show up in the world, the persona, 1st-house energy, what others see
- Differentiate clearly between the Sun and Rising read for the same sign — never write the same paragraph twice
- Close each read with a concrete prompt, reflection question, or felt-sense invitation
- 60-80 words per read. No bullet points. Flowing prose.

LANGUAGE
${LANGUAGE_INSTRUCTIONS[language]}

OUTPUT FORMAT
Return ONLY a JSON object, no preamble, no markdown fences, no explanation.

Shape:
{
  "reads": [
    ${orderedPairs}
  ]
}

Order: Aries→Pisces, and within each sign, Sun first then Rising. Exactly 24 entries.${
    strict
      ? "\n\nCRITICAL: Output ONLY the JSON object. No prose before or after. No code fences. The first character of your response must be `{`."
      : ""
  }`;

  const personalContextNote = transit.horoscopeable
    ? ""
    : "\n\n(Note: this transit was not flagged horoscopeable — proceed anyway, but don't overstate its importance.)";

  const user = `TRANSIT
${transit.title} — ${transit.subtype}
Date: ${transit.date} at ${transit.time} Barcelona local
Position: ${transit.position}
Type: ${transit.type}, intensity: ${transit.intensity}

SKY READING
${transit.description}${personalContextNote}

Generate the 24-read bundle now.`;

  return { system, user };
}
