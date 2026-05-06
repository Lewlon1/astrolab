// Single-post draft prompt builder.
// Pure function — imported by both:
//   - app/api/transit-draft/route.ts  (server, calls Bedrock)
//   - components/admin/transits/DraftModal.tsx  (client, "Copy Prompt" button)
// Do NOT add server-only imports.
//
// Text ported verbatim from `transit_planner_v2.jsx::buildPrompt()`.
// The prototype emitted a single string for Anthropic Messages API; here it's
// split into a SYSTEM (voice/rules/format/pillar/language — stable per-call
// instructions) and USER (transit context + angle + output instruction)
// to fit Bedrock's Converse API. Concatenating SYSTEM + "\n\n" + USER yields
// a prompt functionally equivalent to the prototype's output.

import type { Transit, Pillar, Format, Language } from "./types";

const PILLAR_INSTRUCTION: Record<Pillar, string> = {
  decode:
    "DECODE pillar — your job is to teach. Take a piece of astrology and explain it clearly through a psychological lens. Avoid pop-astrology clichés. Use concrete language and one human example.",
  reframe:
    "REFRAME pillar — your job is to challenge a common misconception. Open with the assumption people hold, then flip it with depth. The post should leave them seeing something familiar differently.",
  relate:
    "RELATE pillar — your job is to be vulnerable and human. Lead with a personal observation, story, or feeling. Astrology is the lens, not the lesson. The reader should feel seen.",
  convert:
    "CONVERT pillar — your job is to move someone toward booking. Lead with the problem they're feeling NOW (use the transit), name the specific service that solves it (Cosmic Quick Hit €25, Blend Reading €65, Stellar Reading €120, Cosmic Alliance €180, Star-Crossed €95), and end with a low-friction CTA (DM keyword LOVECODE for the free voice note, or 'link in bio').",
};

const FORMAT_INSTRUCTION: Record<Format, string> = {
  reel:
    "A 30–60 second VERTICAL VIDEO SCRIPT. Structure: HOOK (1-2 lines, scroll-stopping) | BODY (3-5 short beats with on-screen text suggestions) | CTA (1 line). Include suggested visual/B-roll notes in [brackets]. Total spoken: ~120-150 words.",
  carousel:
    "A 6-7 SLIDE CAROUSEL. For each slide: headline (max 8 words), body (1-2 sentences), and on-slide design note. Slide 1 = hook, slides 2-5 = insight, slide 6 = takeaway, slide 7 = CTA.",
  caption:
    "A LONG-FORM IG CAPTION (200-300 words). Structure: hook line (must work as preview text), 2-3 paragraphs of insight + personal angle, soft CTA at the end. No bullet points unless natural.",
  story:
    "A 3-5 FRAME STORY SEQUENCE. Each frame: short on-screen text (max 15 words), suggested background mood, sticker/poll suggestion if relevant. Last frame = CTA with link sticker note.",
};

const LANGUAGE_INSTRUCTION: Record<Language, string> = {
  en: "Write in English.",
  es: "Escribe en español (España, voz natural y cálida).",
  both:
    "Write BOTH versions: first English, then a section labeled 'ESPAÑOL' with the Spanish version below it.",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(iso: string): { weekday: string; day: number; month: string } {
  const d = new Date(iso + "T12:00:00");
  return {
    weekday: WEEKDAYS[d.getDay()],
    day: d.getDate(),
    month: MONTHS_LONG[d.getMonth()],
  };
}

export interface BuildDraftPromptInput {
  transit: Transit;
  pillar: Pillar;
  format: Format;
  language: Language;
  angle?: string;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildDraftPrompt(input: BuildDraftPromptInput): BuiltPrompt {
  const { transit, pillar, format, language, angle } = input;

  const personalHitContext =
    transit.personalHits.length > 0
      ? `\n\nThis transit personally hits Gabs's chart:\n${transit.personalHits
          .map((h) => `- ${h.aspect} to natal ${h.planet} (${h.natal}): ${h.meaning}`)
          .join("\n")}\nIf the pillar is RELATE, lean into this for the personal story angle.`
      : "";

  const angleNote = angle?.trim()
    ? `\n\nGABS'S SPECIFIC ANGLE FOR THIS POST: ${angle.trim()}\n`
    : "";

  const { weekday, day, month } = formatDate(transit.date);

  const system = `You are drafting Instagram content for Gabriela ("Gabs"), a psychotherapist (10+ years) and astrologer. Brand: Astropsyche Lab.

VOICE:
- Intelligent, warm, grounded. Therapist energy meets astrologer.
- NEVER pop-astrology ("Mercury retrograde is making you crazy!" — banned).
- Psychology-informed framing always available: attachment, defenses, projection, integration.
- Bilingual native (English + Spanish, Puerto Rico → Barcelona).
- Confident but never preachy. Knows when to be soft.
- Specific over vague. One real human example > three abstractions.

NEVER:
- Use emojis as filler. One purposeful emoji max if any.
- Open with "Did you know..." or "Let's talk about..."
- Generic CTAs like "double tap if you agree"

PILLAR: ${PILLAR_INSTRUCTION[pillar]}

FORMAT: ${FORMAT_INSTRUCTION[format]}

LANGUAGE: ${LANGUAGE_INSTRUCTION[language]}`;

  const user = `TRANSIT CONTEXT:
- ${transit.title} on ${weekday} ${day} ${month} 2026 at ${transit.time} Barcelona local
- ${transit.subtype} at ${transit.position}
- Sky reading: ${transit.description}${personalHitContext}${angleNote}

Output ONLY the content shell — no preamble, no "Here's your draft", no meta-commentary. Start directly with the content. Use clear section headers in the content shell where helpful (HOOK, BODY, CTA, etc.) so Gabs can scan it fast.`;

  return { system, user };
}
