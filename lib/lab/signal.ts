// Pure helpers for the admin "Lab signal" page (reads lab_reading_signal_summary, migration 018).

export type SignalLevel = "card" | "relation" | "sun";
export type SignalSort = "score" | "votes" | "approval" | "bookings";

export type SignalRow = {
  level: SignalLevel;
  card: string;
  relation: string | null;
  sun_sign: string | null;
  votes: number;
  ups: number;
  downs: number;
  signups: number;
  booking_clicks: number;
  bookings: number;
  paid: number;
  score: number;
};

export const SIGNAL_LEVELS: readonly SignalLevel[] = ["card", "relation", "sun"];
export const SIGNAL_SORTS: readonly SignalSort[] = ["score", "votes", "approval", "bookings"];

/** Share of thumbs up, 0-1; null with no votes. */
export function approval(r: Pick<SignalRow, "ups" | "votes">): number | null {
  return r.votes > 0 ? r.ups / r.votes : null;
}

/** A known value from the query string, else the fallback. */
export function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * Rows of one level, sorted descending by the chosen measure; ties break on votes, then card name.
 * PostgREST returns bigint counts as numbers or strings, so everything is coerced.
 */
export function sortSignal(rows: readonly SignalRow[], level: SignalLevel, sort: SignalSort): SignalRow[] {
  const key = (r: SignalRow): number =>
    sort === "approval" ? (approval(r) ?? -1) : sort === "votes" ? r.votes : sort === "bookings" ? r.bookings : r.score;
  return rows
    .filter((r) => r.level === level)
    .map((r) => ({
      ...r,
      votes: Number(r.votes), ups: Number(r.ups), downs: Number(r.downs), signups: Number(r.signups),
      booking_clicks: Number(r.booking_clicks), bookings: Number(r.bookings), paid: Number(r.paid), score: Number(r.score),
    }))
    .sort((a, b) => key(b) - key(a) || b.votes - a.votes || a.card.localeCompare(b.card));
}
