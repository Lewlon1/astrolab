// Shared type definitions for the Transit Planner admin tool.
// Used by both client components and API routes.

export type TransitType = "lunation" | "ingress" | "retrograde" | "aspect";
export type TransitIntensity = "major" | "mid" | "minor";

export type Pillar = "decode" | "reframe" | "relate" | "convert";
export type Format = "reel" | "carousel" | "caption" | "story";
export type Language = "en" | "es" | "both";
export type Placement = "sun" | "rising";

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

export const SIGNS: Sign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export interface PersonalHit {
  aspect: string;  // e.g. "trine", "opposition", "approaching conjunction"
  planet: string;  // natal point name: "Sun" | "Moon" | "Ascendant" | etc.
  natal: string;   // free-form natal position, e.g. "Pisces 15°"
  meaning: string;
}

export interface Transit {
  id: string;
  date: string; // ISO YYYY-MM-DD
  time: string; // "HH:MM" Barcelona local
  type: TransitType;
  subtype: string; // e.g. "Full Moon", "Mercury ingress"
  title: string;
  glyph: string;
  position: string; // e.g. "11° Scorpio"
  description: string;
  intensity: TransitIntensity;
  horoscopeable: boolean;
  personalHits: PersonalHit[];
}

export type FilterType = "all" | "lunations" | "ingresses" | "retrogrades" | "aspects";

// Database row shapes (match supabase/transit_*.sql)

export interface TransitDraftRow {
  id: string;
  transit_id: string;
  transit_title: string;
  transit_date: string;
  pillar: Pillar;
  format: Format;
  language: Language;
  angle: string | null;
  content: string;
  created_at: string;
}

export interface HoroscopeRead {
  sign: Sign;
  placement: Placement;
  content: string;
}

export interface TransitHoroscopeRow {
  id: string;
  transit_id: string;
  transit_title: string;
  transit_date: string;
  language: Language;
  reads: HoroscopeRead[];
  created_at: string;
}

// API request/response types

export interface TransitDraftRequest {
  transit: Transit;
  pillar: Pillar;
  format: Format;
  language: Language;
  angle?: string;
}

export interface TransitDraftResponse {
  content: string;
}

export interface TransitHoroscopeRequest {
  transit: Transit;
  language: Language;
}

export interface TransitHoroscopeResponse {
  reads: HoroscopeRead[];
}
