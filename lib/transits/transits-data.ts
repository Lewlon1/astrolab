// ============================================================================
// Transit data for The Astropsyche Lab — May–October 2026.
// Ported verbatim from `transit_planner_v2.jsx` (the standalone prototype).
//
// Sources cross-referenced: CHANI Astrology, Cafe Astrology, Astro-Seek,
// Royal Observatory Greenwich. All major lunations, ingresses, retrograde
// stations, and selected aspects. Times in Barcelona local (CEST/CET).
//
// `horoscopeable` rule: true for all lunations, ingresses, retrograde
// stations, and aspects with intensity === 'major'. False only for minor
// aspects and Moon void-of-course events.
//
// Phase 2 will replace this hardcoded array with a Supabase-backed feed
// populated by the FastAPI Lambda's Swiss Ephemeris endpoint
// (GET /api/transits?from=...&to=...).
// ============================================================================

import type { Transit } from "./types";

export const transits: Transit[] = [
  // ============ MAY 2026 ============
  {
    id: "fullmoon-scorpio-may1",
    date: "2026-05-01",
    time: "19:23",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Scorpio",
    glyph: "☾",
    position: "11° Scorpio",
    description:
      "The Flower Moon — peak emotional intensity. Scorpio asks what you've been hiding from yourself, including the parts that crave depth, control, or merger. Themes: power, intimacy, grief, transformation. The first of TWO full moons in May (a rare 'Blue Moon' month).",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "trine",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Trines her Pisces Sun (4° orb) — emotional release flows easily, intuitive truths surface.",
      },
      {
        aspect: "opposition",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Opposes her Taurus rising (4° orb) — relationship dynamics surface, partner energy is loud.",
      },
    ],
  },
  {
    id: "pluto-rx-may6",
    date: "2026-05-06",
    time: "20:34",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Pluto stations retrograde",
    glyph: "♇℞",
    position: "5° Aquarius 30'",
    description:
      "Pluto turns inward for ~5 months. Themes of power, control, transformation, and hidden truths get reviewed at the deepest level. What you've been quietly building since January gets its first stress-test.",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "mars-taurus-may7",
    date: "2026-05-07",
    time: "01:48",
    type: "ingress",
    subtype: "Mars ingress",
    title: "Mars enters Taurus",
    glyph: "♂",
    position: "0° Taurus",
    description:
      "Mars in Taurus is slow, sensual, stubborn. Action through endurance, not speed. Energy goes toward building, eating well, body work — and digging in heels. Mars stays in Taurus until late June.",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "approaching conjunction",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Mars will conjunct her rising mid-May — a physical-energy spike, leadership moment, and possibly more anger surfacing in her body.",
      },
    ],
  },
  {
    id: "mercury-cazimi-may14",
    date: "2026-05-14",
    time: "16:34",
    type: "aspect",
    subtype: "Cazimi",
    title: "Mercury cazimi (in heart of the Sun)",
    glyph: "☉☿",
    position: "23°48' Taurus",
    description:
      "A rare and prized moment — Mercury sits at the exact heart of the Sun. Mind and identity align. Said-out-loud truths, important emails, sales pages, anything written today carries weight. Witches' best day for ritual writing.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "newmoon-taurus-may16",
    date: "2026-05-16",
    time: "18:01",
    type: "lunation",
    subtype: "New Moon",
    title: "New Moon in Taurus",
    glyph: "●",
    position: "25° Taurus",
    description:
      "The seed-planting moon for Taurus season — money, body, self-worth, slow building. Plant what you want to grow over the next 6 months. Especially potent for anything physical, financial, or pleasure-based.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "conjunction",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "10° from her rising — a personal new-moon for her identity, body, and visibility.",
      },
    ],
  },
  {
    id: "mercury-square-nodes-may19",
    date: "2026-05-19",
    time: "18:13",
    type: "aspect",
    subtype: "Square to Nodes",
    title: "Mercury squares the lunar nodes",
    glyph: "☿□",
    position: "Gemini 4°52' / Pisces & Virgo 4°52'",
    description:
      "A fated communication moment — what's said now lands on the karmic axis. Conversations that suddenly feel destined. A turning-point exchange.",
    intensity: "mid",
    horoscopeable: false,
    personalHits: [],
  },
  {
    id: "sun-gemini-may20",
    date: "2026-05-20",
    time: "21:36",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Gemini — Gemini season begins",
    glyph: "☉",
    position: "0° Gemini",
    description:
      "Curiosity, conversation, multi-threading. Energy gets quicker and lighter. A season for content, networking, side-quests, learning out loud.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "square",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Squares her Pisces Sun mid-season — tension between her dreamy nature and Gemini's social demands. Good fuel for vulnerable content.",
      },
      {
        aspect: "opposition",
        planet: "Moon",
        natal: "Sagittarius 15°",
        meaning:
          "The Sun will oppose her natal Moon mid-Gemini season — a public/private push-pull.",
      },
    ],
  },
  {
    id: "uranus-cazimi-may22",
    date: "2026-05-22",
    time: "16:24",
    type: "aspect",
    subtype: "Cazimi",
    title: "Uranus cazimi (in heart of the Sun)",
    glyph: "☉♅",
    position: "1°30' Gemini",
    description:
      "An extraordinary, generation-shifting moment. Uranus and Sun meet at the start of Uranus's 7-year journey through Gemini. The future seeds itself today. Watch for sudden insight, breakthrough, awakening.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "mars-square-pluto-may26",
    date: "2026-05-26",
    time: "06:02",
    type: "aspect",
    subtype: "Square",
    title: "Mars square Pluto Rx",
    glyph: "♂□♇",
    position: "Taurus 5° / Aquarius 5°",
    description:
      "Friction with power. Old anger, control battles, breaking-point moments. Don't make impulsive moves — but DO notice what wants to come up and out. One of the most charged aspects of the month.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "fullmoon-sag-may31",
    date: "2026-05-31",
    time: "10:45",
    type: "lunation",
    subtype: "Full Moon (Blue Moon)",
    title: "Full Moon in Sagittarius (Blue Moon)",
    glyph: "☾",
    position: "9°55' Sagittarius",
    description:
      "The second full moon of May — a calendar-month Blue Moon. Sagittarius asks the bigger question: what do you actually believe? Where are you contracting your truth to fit in? Themes: meaning, freedom, philosophy, the long view.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "conjunction",
        planet: "Moon",
        natal: "Sagittarius 15°",
        meaning:
          "Within 5° of her natal Moon — an extremely personal full moon. Emotions she's been carrying all year come to a head. The most personally significant lunation of the spring for her.",
      },
    ],
  },

  // ============ JUNE 2026 ============
  {
    id: "venus-jupiter-jun9",
    date: "2026-06-09",
    time: "21:55",
    type: "aspect",
    subtype: "Conjunction",
    title: "Venus conjoins Jupiter in Cancer",
    glyph: "♀☌♃",
    position: "25°46' Cancer",
    description:
      "The luckiest aspect of the year for love, money, beauty, generosity. Venus and Jupiter together in Cancer = abundance through tenderness, family blessings, soft-edged wins. A gold-star day for launches, asking for something, signing love or money things.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "trine",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Cancer at 25° trines her Pisces Sun — a soft, romantic, abundance-coded window. Ideal for content about love, magic, intuitive women, and selling sessions.",
      },
    ],
  },
  {
    id: "newmoon-gemini-jun15",
    date: "2026-06-15",
    time: "04:54",
    type: "lunation",
    subtype: "New Moon",
    title: "New Moon in Gemini",
    glyph: "●",
    position: "24°02' Gemini",
    description:
      "Plant seeds for new conversations, new connections, new ways of thinking. Gemini new moons favour content, learning, networking, pitching. What did you hesitate to say? Say it.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "chiron-taurus-jun19",
    date: "2026-06-19",
    time: "23:20",
    type: "ingress",
    subtype: "Chiron ingress",
    title: "Chiron enters Taurus (~50 yr transit)",
    glyph: "⚷",
    position: "0° Taurus",
    description:
      "Chiron leaves Aries (8-year transit of identity wounds) and enters Taurus, where it will stay for ~8 years. The wound shifts from 'who am I' to 'what do I deserve, what's my body worth, what's enough'. A massive collective threshold.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "in same sign",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Chiron entering her rising sign is a years-long initiation — body, self-image, embodiment, worthiness. By 2028 Chiron will conjunct her exact rising. This is one of the defining transits of her decade.",
      },
    ],
  },
  {
    id: "sun-cancer-jun21",
    date: "2026-06-21",
    time: "10:25",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Cancer — Summer Solstice",
    glyph: "☉",
    position: "0° Cancer",
    description:
      "Summer Solstice in the Northern Hemisphere. The longest day. Cancer season turns the energy toward home, family, emotional roots, what nourishes. Soft, slow, feelings-forward.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "trine",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Cancer trines her Pisces Sun (water trine) — her natural element. A creative, intuitive, easeful season for her.",
      },
    ],
  },
  {
    id: "mercury-rx-jun29",
    date: "2026-06-29",
    time: "22:35",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Mercury stations retrograde in Cancer",
    glyph: "☿℞",
    position: "26°15' Cancer",
    description:
      "Mercury retrograde in Cancer — emotions get re-felt, family conversations re-open, old messages resurface. Different from the usual MR chaos: this one is INWARD. Until July 23.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "jupiter-leo-jun30",
    date: "2026-06-30",
    time: "07:51",
    type: "ingress",
    subtype: "Jupiter ingress",
    title: "Jupiter enters Leo (~1 yr transit)",
    glyph: "♃",
    position: "0° Leo",
    description:
      "Jupiter leaves Cancer and enters Leo for the year ahead. The sign-shift of the year. Themes of expansion move from emotional/family/home to creative/visible/dramatic. What do you want to be SEEN doing? Jupiter in Leo expands stage presence, creative leadership, generosity, joy.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "square",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Jupiter in Leo will square her Taurus rising for much of the year — pressure to grow visibility, stretch out of the comfort zone, take a bigger creative risk.",
      },
    ],
  },
  {
    id: "fullmoon-cap-jun30",
    date: "2026-06-30",
    time: "01:56",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Capricorn",
    glyph: "☾",
    position: "8°14' Capricorn",
    description:
      "The first of two Capricorn cycles this year. A serious moon — what structures are working, what aren't, what you need to release to free up your time and energy. Career and ambition themes peak.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "trine",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Earth trine to her rising — a grounding, productive, get-things-done full moon for her body and projects.",
      },
    ],
  },

  // ============ JULY 2026 ============
  {
    id: "newmoon-cancer-jul14",
    date: "2026-07-14",
    time: "11:43",
    type: "lunation",
    subtype: "New Moon",
    title: "New Moon in Cancer",
    glyph: "●",
    position: "21°59' Cancer",
    description:
      "Set intentions in the realm of home, family, emotional safety, mothering yourself. Mercury is still retrograde so the seeds are inward — what do you want to FEEL more of?",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "trine",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "A water-trine new moon to her Sun — a deeply personal seed-planting window. One of her best moons of the year for intention-setting.",
      },
    ],
  },
  {
    id: "sun-leo-jul22",
    date: "2026-07-22",
    time: "21:13",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Leo — Leo season begins",
    glyph: "☉",
    position: "0° Leo",
    description:
      "Leo season. Be seen. Be loved. Take up space. With Jupiter newly in Leo, this is the most expansive Leo season in 12 years. Don't shrink.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "square",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Leo squares her Taurus rising — visibility pressure. The push to show up bigger, be more public, even when it's uncomfortable.",
      },
      {
        aspect: "trine",
        planet: "Moon",
        natal: "Sagittarius 15°",
        meaning:
          "Leo trines her Sag Moon — emotional fire, joy, creativity flowing. Her enthusiasm is contagious this season.",
      },
    ],
  },
  {
    id: "mercury-direct-jul23",
    date: "2026-07-23",
    time: "19:50",
    type: "retrograde",
    subtype: "Station Direct",
    title: "Mercury stations direct in Cancer",
    glyph: "☿D",
    position: "11° Cancer",
    description:
      "Mercury retrograde ends. Emails get answered, conversations move forward again, the fog lifts. Shadow period until early August — give yourself another 2 weeks before launching anything major.",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "saturn-rx-jul26",
    date: "2026-07-26",
    time: "13:00",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Saturn stations retrograde in Aries",
    glyph: "♄℞",
    position: "1° Aries",
    description:
      "Saturn turns inward for ~5 months. The structures and commitments you've taken on since February (when Saturn entered Aries) get pressure-tested. What's worth keeping? What's a burden you took on for the wrong reasons?",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "fullmoon-aqua-jul29",
    date: "2026-07-29",
    time: "16:36",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Aquarius",
    glyph: "☾",
    position: "6°30' Aquarius",
    description:
      "An air-fixed full moon. Themes of friendship, community, the future, the collective. Where are you over-individualising? Where are you under-individualising? This moon clarifies your relationship to belonging.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },

  // ============ AUGUST 2026 ============
  {
    id: "solar-eclipse-aug12",
    date: "2026-08-12",
    time: "19:45",
    type: "lunation",
    subtype: "TOTAL Solar Eclipse",
    title: "Total Solar Eclipse in Leo (visible in Spain!)",
    glyph: "☉☾",
    position: "20°01' Leo",
    description:
      "A LANDMARK event — total solar eclipse visible across northern Spain, Iceland, and Greenland. This is one of the rarest astronomical events of the decade for Spain specifically. Eclipse energy: a hard reset, a doorway, a before-and-after. Whatever this eclipse touches in your chart, treat as fated.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "square",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Squares her Taurus rising at 5° orb — a major eclipse hit on her body/identity axis. The next 18 months will significantly reshape her public-facing self. Major content angle: 'what the eclipse asks you to release as visibility-keepers'.",
      },
    ],
  },
  {
    id: "sun-virgo-aug22",
    date: "2026-08-22",
    time: "23:18",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Virgo — Virgo season begins",
    glyph: "☉",
    position: "0° Virgo",
    description:
      "Virgo season turns the energy toward refinement, devotion, daily practice, body, work. After the eclipse fire, this is the cooling-down, returning-to-craft season.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "opposition",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Virgo opposes her Pisces Sun — the season she most directly contrasts with her nature. A challenging-but-clarifying season for her: routines, structure, real-world execution.",
      },
    ],
  },
  {
    id: "lunar-eclipse-aug28",
    date: "2026-08-28",
    time: "06:12",
    type: "lunation",
    subtype: "PARTIAL Lunar Eclipse",
    title: "Partial Lunar Eclipse in Pisces",
    glyph: "☾⊙",
    position: "4°53' Pisces",
    description:
      "The companion eclipse to August 12's solar. Pisces lunar eclipses dissolve, soften, release. What dream are you done holding onto? What grief is ready to move? Lunar eclipses are RELEASE points — don't fight what wants to leave.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "conjunction",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Conjuncts her Sun within 10° — a lunar eclipse releasing something deep about her core identity. Personally significant. Major journaling/ritual day for her, and gold for vulnerable RELATE content.",
      },
    ],
  },

  // ============ SEPTEMBER 2026 ============
  {
    id: "uranus-rx-sep11",
    date: "2026-09-11",
    time: "00:30",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Uranus stations retrograde in Gemini",
    glyph: "♅℞",
    position: "5°42' Gemini",
    description:
      "Uranus turns retrograde for the rest of 2026. The breakthroughs and disruptions Uranus has been bringing since May get an internal review. What did you start that you're not sure about? What needs to break before it builds?",
    intensity: "mid",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "newmoon-virgo-sep11",
    date: "2026-09-11",
    time: "05:27",
    type: "lunation",
    subtype: "New Moon",
    title: "New Moon in Virgo",
    glyph: "●",
    position: "18°25' Virgo",
    description:
      "After eclipse season, this new moon is a quiet reset. Plant seeds for daily practice, body, work routines, the small consistent things that build a life. The new moon of recovery and refinement.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "opposition",
        planet: "Sun",
        natal: "Pisces 15°",
        meaning:
          "Opposes her Sun — a relationship-axis new moon, fertile for content about partnership patterns, projection, what we offload onto others.",
      },
    ],
  },
  {
    id: "sun-libra-sep22",
    date: "2026-09-22",
    time: "20:05",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Libra — Autumn Equinox",
    glyph: "☉",
    position: "0° Libra",
    description:
      "Equinox — equal day and night. Libra season. Themes of balance, relationship, beauty, fairness. The natural reset point of the second half of the year.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "fullmoon-aries-sep26",
    date: "2026-09-26",
    time: "18:49",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Aries",
    glyph: "☾",
    position: "3°37' Aries",
    description:
      "A high-energy, brave-the-thing full moon. Aries asks: what have you been holding back? Where do you need to act, even imperfectly? Cardinal fire. Cut something out, start something else.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },

  // ============ OCTOBER 2026 ============
  {
    id: "venus-rx-oct3",
    date: "2026-10-03",
    time: "12:58",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Venus stations retrograde in Scorpio",
    glyph: "♀℞",
    position: "8°29' Scorpio",
    description:
      "VENUS RX — once every 18 months. Until November 13. Old loves resurface, money values get re-evaluated, what you've called 'beauty' or 'worth' gets its pressure test. Don't make permanent changes to face/style/relationships during this window.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "opposition",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Venus retrograde in Scorpio opposes her rising for over a month — a major review of partnership, attraction patterns, and how she shows up to others.",
      },
    ],
  },
  {
    id: "newmoon-libra-oct10",
    date: "2026-10-10",
    time: "17:50",
    type: "lunation",
    subtype: "New Moon",
    title: "New Moon in Libra",
    glyph: "●",
    position: "17°21' Libra",
    description:
      "Set intentions for relationship, beauty, balance, fairness. With Venus retrograde simultaneously, this new moon is for reviewing-then-renewing — what do you actually want from your closest people?",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "sun-scorpio-oct23",
    date: "2026-10-23",
    time: "06:24",
    type: "ingress",
    subtype: "Sun ingress",
    title: "Sun enters Scorpio — Scorpio season begins",
    glyph: "☉",
    position: "0° Scorpio",
    description:
      "Scorpio season + Venus retrograde + Mercury about to retrograde = one of the most intense weeks of the year. Lean into depth, shadow, intimacy, real conversations. The veil thins.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "opposition",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Scorpio opposes her Taurus rising — relationship intensity, partner energy, hidden dynamics surface. Her 7th-house season.",
      },
    ],
  },
  {
    id: "mercury-rx-oct24",
    date: "2026-10-24",
    time: "23:14",
    type: "retrograde",
    subtype: "Station Retrograde",
    title: "Mercury stations retrograde in Scorpio",
    glyph: "☿℞",
    position: "5° Scorpio",
    description:
      "The last Mercury retrograde of 2026 — and the deepest. In Scorpio, communication turns toward what's been buried. Old conversations come back, secrets surface, things that were 'done' aren't done. Until November 13.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [],
  },
  {
    id: "fullmoon-taurus-oct26",
    date: "2026-10-26",
    time: "06:11",
    type: "lunation",
    subtype: "Full Moon",
    title: "Full Moon in Taurus",
    glyph: "☾",
    position: "2°45' Taurus",
    description:
      "A full moon directly in her ascendant sign while Mercury and Venus are both retrograde. The body knows. Slow down. Pay attention to what your senses are telling you.",
    intensity: "major",
    horoscopeable: true,
    personalHits: [
      {
        aspect: "conjunction",
        planet: "Ascendant",
        natal: "Taurus 15°",
        meaning:
          "Taurus full moon at 2° — within 13° of her rising. Body, embodiment, sensuality come into peak focus. A major personal full moon.",
      },
    ],
  },
];
