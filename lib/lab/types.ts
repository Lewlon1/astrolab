// Shared types for the Lab Draw server libraries. No runtime code.
import type { Body, Position, Sign } from "@/lib/astro";
import type { Houses } from "@/lib/astro/houses";

/**
 * Chart as stored in `lab_profiles.positions` (jsonb). A JSON-safe subset of the
 * computeChart result: no Date, and `houses` is null when the birth time is unknown.
 */
export type StoredChart = {
  version: 1;
  hasTime: boolean;
  approximateZone: boolean;
  /** Includes `house` on each position only when hasTime. */
  positions: Position[];
  /** Bodies whose sign changes across the birth day (only without a time). */
  ambiguous: Partial<Record<Body, Sign[]>>;
  houses: Houses | null;
  rising: Sign | null;
};

/** Row shape of `lab_profiles` (migration 016) as returned by Supabase. */
export type LabProfileRow = {
  id: string;
  user_id: string | null;
  email: string;
  lead_id: string | null;
  card_drawn: string;
  /** YYYY-MM-DD */
  birth_date: string;
  /** HH:MM:SS, or null when unknown */
  birth_time: string | null;
  birth_place_text: string;
  lat: number;
  lon: number;
  tz: string;
  birth_utc: string;
  positions: StoredChart;
  src: string | null;
  consent_at: string;
  consent_text_version: string;
  next_transit: string | null;
  transit_peak_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};
