import type { DeviceType } from "@/types";

/**
 * Coarse device class from a user-agent string. Deliberately low-resolution —
 * we never store the raw UA, only one of these buckets. Also flags obvious bots
 * so the dashboard can exclude them.
 */
export function detectDevice(ua: string | null | undefined): DeviceType {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (
    /(bot|crawl|spider|slurp|bingpreview|headlesschrome|lighthouse|pingdom|gtmetrix|facebookexternalhit|embedly)/.test(
      s
    )
  ) {
    return "bot";
  }
  // Tablets first (Android tablets lack "mobile" in the UA).
  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobi))/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) {
    return "mobile";
  }
  return "desktop";
}
