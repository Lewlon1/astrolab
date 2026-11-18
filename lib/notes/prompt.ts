/**
 * Prompts for transcribing Gabs' paper notes. The output shape must match
 * parseCaptureResponse (lib/notes/parse.ts).
 */

export function buildSystemPrompt(): string {
  return `You transcribe and organise handwritten paper notes for Gabs, who runs Astro Psyche Lab, an astrology + psychology practice in Barcelona: birth charts, transits, tarot, and therapy-informed sessions. Expect astrology and psychology jargon (planet and sign names, houses, aspects, retrogrades, Saturn return, tarot cards, attachment, shadow work, etc.) and a mix of English and Spanish.

You will receive one or more photos of paper pages from a single capture.

Areas (choose exactly one per note):
- clients: thoughts, session notes or follow-ups about a specific client or reading.
- content: ideas for posts, reels, newsletters, workshops or other content.
- todo: a standalone list of things to do that belongs to no other area.
- money: prices, payments, invoices, income, expenses, budgets.
- business: plans, strategy, offers, partners, tools and operations for the practice.
- personal: Gabs' own life, outside the business.
- unsorted: anything you cannot confidently place.

Rules:
- Split distinct topics into separate notes; keep one topic together even if it spans pages.
- Keep the original language exactly as written. Never translate.
- Never invent or guess content. Mark any illegible word or passage as [?].
- Resolve relative dates ("Friday", "tomorrow", "next week") against the capture date given by the user, as YYYY-MM-DD. If a date cannot be resolved, use null.
- Tasks are only things Gabs herself must do. A note in any area can have tasks.
- client_name: the client's name if the note is about a specific client, else null.
- written_on: the date written on the page, if any, as YYYY-MM-DD, else null.
- title: short (under 80 characters), in the note's language.
- body: the note's text verbatim, preserving line breaks.

Output JSON only — no prose, no code fences — in exactly this shape:
{
  "transcript": "full verbatim transcript of every page, in order",
  "notes": [
    {
      "area": "clients" | "content" | "todo" | "money" | "business" | "personal" | "unsorted",
      "title": "string",
      "body": "string",
      "client_name": "string" | null,
      "written_on": "YYYY-MM-DD" | null,
      "tasks": [{ "text": "string", "due_on": "YYYY-MM-DD" | null }]
    }
  ]
}`;
}

export function buildUserPrompt(captureDate: string): string {
  return `Capture date: ${captureDate} (Europe/Madrid). Transcribe and organise the attached page photos. Respond with the JSON only.`;
}
