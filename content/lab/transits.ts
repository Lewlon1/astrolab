// DRAFT — Gabs to rewrite in her voice
// Transit copy is composed from three small phrase tables, so every planet/aspect/point
// combination reads consistently. The transit is a prompt for noticing, not a cause.

export type TransitPlanet = "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";
export type TransitPoint = "Sun" | "Moon" | "Rising" | "Venus" | "Saturn";
export type TransitAspect = "conjunction" | "square" | "opposition" | "trine";

export const TRANSIT_PLANETS: readonly TransitPlanet[] = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
export const TRANSIT_POINTS: readonly TransitPoint[] = ["Sun", "Moon", "Rising", "Venus", "Saturn"];
export const TRANSIT_ASPECTS: readonly TransitAspect[] = ["conjunction", "square", "opposition", "trine"];

/** theme: what astrologers associate with the planet. psych: a research area, named without overclaiming. */
export const PLANET_PHRASES: Record<TransitPlanet, { name: string; theme: string; psych: string }> = {
  Jupiter: {
    name: "Jupiter",
    theme: "expansion, optimism and the search for meaning",
    psych: "research on optimism and on approach motivation, which looks at how expecting good outcomes relates to taking opportunities",
  },
  Saturn: {
    name: "Saturn",
    theme: "structure, responsibility and what has to be earned",
    psych: "research on conscientiousness and self-regulation, which looks at how people hold to commitments under pressure",
  },
  Uranus: {
    name: "Uranus",
    theme: "disruption, independence and sudden change",
    psych: "research on openness to experience and on how people adapt to unplanned change",
  },
  Neptune: {
    name: "Neptune",
    theme: "dissolving boundaries, imagination and idealism",
    psych: "research on ambiguity tolerance and on how imagination and daydreaming relate to creativity and to avoidance",
  },
  Pluto: {
    name: "Pluto",
    theme: "deep transformation, power and what must end",
    psych: "research on identity change and on grief, which looks at how people rebuild a sense of self after loss",
  },
};

/** label: how the point is named in headlines. area: the part of life astrologers read it as. */
export const POINT_PHRASES: Record<TransitPoint, { label: string; area: string }> = {
  Sun: { label: "Sun", area: "your sense of identity and vitality" },
  Moon: { label: "Moon", area: "your emotional life and what helps you settle" },
  Rising: { label: "Rising", area: "how you meet the world and are met by it" },
  Venus: { label: "Venus", area: "what you value and how you give and receive affection" },
  Saturn: { label: "Saturn", area: "your relationship with responsibility and limits" },
};

/** verb: used in the headline. tone: how astrologers describe the contact. */
export const ASPECT_PHRASES: Record<TransitAspect, { verb: string; tone: string }> = {
  conjunction: { verb: "meets", tone: "a merging, when the two themes occupy the same ground" },
  square: { verb: "squares", tone: "friction, when the two themes pull in different directions" },
  opposition: { verb: "opposes", tone: "a tug-of-war, when the two themes face each other across the chart" },
  trine: { verb: "trines", tone: "an easy flow, when the two themes support each other" },
};

/** Short season names for the profile timeline. */
export const SEASON_NAMES: Record<TransitPlanet, string> = {
  Jupiter: "Room to grow",
  Saturn: "Testing what you've built",
  Uranus: "Shake-ups and new freedom",
  Neptune: "Blurred edges",
  Pluto: "Deep change",
};

/** The natal point in a few plain words, for the timeline. */
export const POINT_SHORT: Record<TransitPoint, string> = {
  Sun: "who you are",
  Moon: "what helps you settle",
  Rising: "how you show up",
  Venus: "what you value",
  Saturn: "your commitments",
};

/** e.g. "Testing what you've built · who you are" */
export const transitTheme = (planet: TransitPlanet, point: TransitPoint) =>
  `${SEASON_NAMES[planet]} · ${POINT_SHORT[point]}`;

/**
 * Compose the three-layer copy for one transit.
 * @param planet the transiting planet
 * @param aspect the aspect it makes
 * @param point the natal point it contacts
 * @returns headline plus astro, psych and test layers
 */
export function transitCopy(
  planet: TransitPlanet,
  aspect: TransitAspect,
  point: TransitPoint,
): { headline: string; astro: string; psych: string; test: string } {
  const pl = PLANET_PHRASES[planet];
  const pt = POINT_PHRASES[point];
  const asp = ASPECT_PHRASES[aspect];
  return {
    headline: `${pl.name} ${asp.verb} your ${pt.label}`,
    astro: `${pl.name} stands for ${pl.theme}. Astrologers read this transit as ${asp.tone}, here touching ${pt.area}.`,
    psych: `Psychology has nothing to say about the sky itself. It does study the territory this transit points at: ${pl.psych}.`,
    test: `For the next few weeks, note each time ${pl.theme.split(",")[0]} comes up around ${pt.area}. Write one line each time, then read them back at the end.`,
  };
}
