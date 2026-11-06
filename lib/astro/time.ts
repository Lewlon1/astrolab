// Birth time → UTC with historical time-zone rules (Luxon + tz-lookup).

import { DateTime } from "luxon";
import tzlookup from "tz-lookup";

export type AstroTimeErrorCode = "INVALID_ZONE" | "INVALID_DATE" | "INVALID_TIME" | "INVALID_COORDS";

export class AstroTimeError extends Error {
  readonly code: AstroTimeErrorCode;
  constructor(code: AstroTimeErrorCode, message: string) {
    super(message);
    this.name = "AstroTimeError";
    this.code = code;
  }
}

/** IANA zone for a coordinate (e.g. "Europe/Madrid"). */
export function zoneFor(lat: number, lon: number): string {
  try {
    return tzlookup(lat, lon);
  } catch {
    throw new AstroTimeError("INVALID_COORDS", "Coordinates are out of range");
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function localToUtc(
  dateISO: string,
  timeHHMM: string | null,
  zone: string,
): { utc: Date; dayStartUtc: Date; dayEndUtc: Date; approximateZone: boolean } {
  if (!DateTime.local({ zone }).isValid) {
    throw new AstroTimeError("INVALID_ZONE", "Unknown time zone");
  }
  if (!DATE_RE.test(dateISO)) {
    throw new AstroTimeError("INVALID_DATE", "Date must be YYYY-MM-DD");
  }
  if (timeHHMM !== null && !TIME_RE.test(timeHHMM)) {
    throw new AstroTimeError("INVALID_TIME", "Time must be HH:MM (24h)");
  }

  const at = (hhmm: string) => DateTime.fromISO(`${dateISO}T${hhmm}`, { zone });
  const local = at(timeHHMM ?? "12:00");
  const dayStart = at("00:00");
  const dayEnd = at("23:59");
  if (!local.isValid || !dayStart.isValid || !dayEnd.isValid) {
    throw new AstroTimeError("INVALID_DATE", "Date does not exist");
  }

  return {
    utc: local.toUTC().toJSDate(),
    dayStartUtc: dayStart.toUTC().toJSDate(),
    dayEndUtc: dayEnd.toUTC().toJSDate(),
    // IANA history before 1970 is best-effort (LMT, wartime rules, etc.).
    approximateZone: local.year < 1970,
  };
}
