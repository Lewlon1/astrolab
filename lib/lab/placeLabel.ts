// Pure helpers for place names. No server imports, so client code may use them too.

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Short, readable form of a Nominatim display_name: the place itself plus its
 * last two non-numeric parts (usually region and country), skipping postcodes.
 * "Santiago, Provincia de Santiago, Santiago Metropolitan Region, 8320000, Chile"
 * becomes "Santiago, Santiago Metropolitan Region, Chile".
 */
export function shortPlaceLabel(displayName: string): string {
  const parts = displayName
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^[\d\s-]+$/.test(p));
  if (parts.length <= 3) return parts.join(", ") || displayName.trim();
  return [parts[0], ...parts.slice(-2)].join(", ");
}
