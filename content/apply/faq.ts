// DRAFT — Gabs to rewrite in her voice

export type FaqItem = { id: string; q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    // The question must name the word people search for. The answer must not describe the offer with it.
    id: "what-kind-of-work",
    q: "Is this therapy?",
    a: "No. It's reflective coaching that uses astrology as a lens. Everyone is screened on the first call, and if something needs clinical support, Gabs will say so and suggest where to find it.",
  },
  {
    id: "birth-time",
    q: "Do I need my birth time?",
    a: "It helps, because it gives your rising sign and houses. If you don't know it, we work with your date and place, and you can add the time later.",
  },
  {
    id: "the-call",
    q: "What happens on the call?",
    a: "Fifteen minutes on video with Gabs. She asks what you want from 2027, explains how the programme works, and you both decide whether it fits. There's no hard sell.",
  },
  {
    id: "not-for-me",
    q: "What if it isn't for me?",
    a: "Then we say so on the call, and you leave with a suggestion for what might suit you better. Applying doesn't commit you to anything.",
  },
];
