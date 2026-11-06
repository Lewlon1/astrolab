// Core types for the natal-chart engine (The Lab Draw).

export type Body =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto"
  | "NorthNode";

export const BODIES: readonly Body[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "NorthNode",
];

export type Sign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type Position = {
  body: Body;
  /** Geocentric apparent ecliptic longitude of date, 0–360. */
  lon: number;
  sign: Sign;
  /** Degree within the sign, 0–30. */
  degree: number;
  retrograde?: boolean;
  /** House 1–12; present only when the birth time is known. */
  house?: number;
};

export type ChartPoint = Body | "Ascendant" | "MC";
