// Minimal types for tz-lookup (CC0-1.0), which ships none.
declare module "tz-lookup" {
  /** Returns the IANA time zone name for a latitude/longitude. Throws on invalid coordinates. */
  export default function tzlookup(lat: number, lon: number): string;
}
