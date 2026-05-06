// ============================================================================
// TODO: Port the full ~34-entry transit array from `transit_planner_v2.jsx`
// (May 1, 2026 → Oct 26, 2026) once the prototype is supplied.
//
// For each ported entry, set `horoscopeable: true` for:
//   - all lunations (New Moons, Full Moons, eclipses)
//   - all ingresses (Sun + Moon + Mercury + Venus + Mars + Jupiter + Saturn
//     + Uranus + Neptune + Pluto + Chiron entering a new sign)
//   - all retrograde stations
//   - all aspects with `intensity: 'major'`
//
// `horoscopeable: false` only on minor aspects and Moon void-of-course events.
//
// Phase 2 will replace this hardcoded array with a Supabase-backed feed
// populated by the FastAPI Lambda's Swiss Ephemeris endpoint
// (GET /api/transits?from=...&to=...).
// ============================================================================

import type { Transit } from "./types";

export const transits: Transit[] = [
  {
    id: "placeholder-2026-05-01-full-moon-scorpio",
    date: "2026-05-01",
    time: "19:23",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Scorpio",
    glyph: "🌕",
    position: "11° Scorpio",
    description:
      "A Full Moon in Scorpio asks what's been simmering under the surface. Themes of intimacy, control, and shared resources crest into visibility — what you've been protecting becomes harder to hide. Read the bodily reaction first, the story second.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        natalPoint: "Ascendant",
        natalSign: "Taurus",
        natalDegree: 15,
        aspect: "opposition",
        orb: 4,
        reading:
          "Lights up your relationship axis. Something a partner has been holding back wants to surface — or you do.",
      },
    ],
  },
  {
    id: "placeholder-2026-05-15-mercury-ingress-gemini",
    date: "2026-05-15",
    time: "08:42",
    type: "ingress",
    subtype: "Mercury ingress Gemini",
    title: "Mercury enters Gemini",
    glyph: "☿",
    position: "0° Gemini",
    description:
      "Mercury comes home. Conversations multiply, ideas sharpen, your inbox starts moving. A good window for batching content, sending the message you've been drafting, and following curiosity wherever it leads.",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "placeholder-2026-08-12-jupiter-trine-saturn",
    date: "2026-08-12",
    time: "14:08",
    type: "aspect",
    subtype: "Jupiter trine Saturn",
    title: "Jupiter trine Saturn",
    glyph: "♃△♄",
    position: "12° Cancer / 12° Pisces",
    description:
      "A rare structural alignment between expansion and discipline. Plans you've been quietly building start to feel feasible. The work isn't dramatic — it's the kind that compounds.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        natalPoint: "Sun",
        natalSign: "Pisces",
        natalDegree: 15,
        aspect: "conjunction",
        orb: 3,
        reading:
          "Direct hit to your Sun. A long-term project finds its structural footing — protect this one.",
      },
    ],
  },
];
