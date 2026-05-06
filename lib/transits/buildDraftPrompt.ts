// Single-post draft prompt builder.
// Pure function — imported by both:
//   - app/api/transit-draft/route.ts  (server, calls Bedrock)
//   - components/admin/transits/DraftModal.tsx  (client, "Copy Prompt" button)
// Do NOT add server-only imports (fs, path, etc.).
//
// TODO: Once `transit_planner_v2.jsx` is supplied, replace the prompt body
// below with the prototype's `buildPrompt()` text verbatim. The function
// signature stays the same so callers don't break.

import type { Transit, Pillar, Format, Language } from "./types";

const PILLARS: Record<Pillar, string> = {
  decode:
    "Decode — explain what the transit IS and how it actually works astrologically + psychologically. Specific, never generic.",
  reframe:
    "Reframe — shift the lens. Take a common interpretation people hear and challenge it with a more useful, psychology-informed angle.",
  relate:
    "Relate — bring it down to lived experience. Relationships, attachment patterns, how this shows up in conversations and bodies, not just charts.",
  convert:
    "Convert — invite the reader to take action: book a Cosmic Quick Hit (€25), Stellar Insights (€65), Star-Crossed synastry (€95), Cosmic Alliance with astrocartography (€180), or grab the free Love & Career Code lead magnet.",
};

const FORMATS: Record<Format, string> = {
  reel:
    "30-60 second vertical Reel script. Structure: HOOK (first 3s, grab attention) / BODY (3 specific points or one tight story) / CTA. Conversational, never scripted-sounding. Output as labelled sections.",
  carousel:
    "6-8 slide Instagram carousel. Slide 1 hook, slide 2 myth/misconception, slides 3-N specific insights, second-to-last takeaway, last CTA. Each slide under 30 words. Output as numbered slides.",
  caption:
    "Standalone Instagram caption. Engaging, personal, under 2200 chars. Open with a hook, deliver the insight, close with a question or CTA. Add 8-12 relevant hashtags at the end.",
  story:
    "2-3 Instagram story slides. Punchy, single-thought-per-slide, designed to be tapped through. Last slide has the CTA or sticker prompt. Output as numbered slides.",
};

const LANGUAGES: Record<Language, string> = {
  en: "Write in English only.",
  es: "Write in Spanish only (warm, conversational, Barcelona-natural).",
  both:
    "Provide TWO versions: an English version first, then a Spanish version. Label each clearly with 'EN:' and 'ES:' headers. Don't translate word-for-word — adapt the tone naturally for each language.",
};

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

const BRAND_VOICE = `You are a content writer for The Astro Psyche Lab, an astrology + psychology brand run by Gabs in Barcelona. Her voice:
- Warm, insightful, never fluffy or generic
- Specific and slightly provocative
- Blends astrological knowledge with psychological depth (attachment theory, somatic awareness, cognitive patterns)
- Bilingual audience (English primary, some Spanish)
- Always ties insights back to recognisable, lived patterns — not abstract horoscope-speak`;

export function buildDraftPrompt(input: BuildDraftPromptInput): BuiltPrompt {
  const { transit, pillar, format, language, angle } = input;

  const personalHitsBlock =
    transit.personalHits.length > 0
      ? `\n\nPERSONAL HITS to Gabs's natal chart (use these only if they strengthen the post — don't force):\n${transit.personalHits
          .map(
            (h) =>
              `- ${h.aspect} to natal ${h.natalPoint} (${h.natalDegree}° ${h.natalSign}, orb ${h.orb}°): ${h.reading}`
          )
          .join("\n")}`
      : "";

  const angleBlock = angle?.trim() ? `\n\nANGLE / hook the post should hit:\n${angle.trim()}` : "";

  const system = `${BRAND_VOICE}

You're drafting a single piece of content built around one specific astrological transit.

CONTENT PILLAR
${PILLARS[pillar]}

FORMAT
${FORMATS[format]}

LANGUAGE
${LANGUAGES[language]}

Output ONLY the content itself. No preamble, no meta-commentary, no "Here's your post:". The content should be ready to paste directly into the platform.`;

  const user = `TRANSIT
${transit.title} — ${transit.subtype}
Date: ${transit.date} at ${transit.time} Barcelona local
Position: ${transit.position}
Type: ${transit.type}, intensity: ${transit.intensity}

SKY READING
${transit.description}${personalHitsBlock}${angleBlock}

Draft the ${format} now.`;

  return { system, user };
}
