export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const ready = () =>
  typeof window !== "undefined" && typeof window.fbq === "function";

export const pageview = () => {
  if (ready()) window.fbq!("track", "PageView");
};

export const track = (event: string, params?: Record<string, unknown>) => {
  if (ready()) window.fbq!("track", event, params);
};

/**
 * Fire the Lead conversion with Advanced Matching.
 *
 * Passing the visitor's email lets the Pixel normalise + SHA-256 hash it
 * (client-side — the raw email never leaves the browser) and attach it to the
 * event. The Conversions API Gateway then forwards that hashed email server-side,
 * which raises Event Match Quality and helps Meta attribute the conversion even
 * when cookies/iOS block the browser pixel.
 *
 * No-ops safely if fbq hasn't loaded (i.e. before cookie consent).
 */
export const trackLead = (email?: string) => {
  if (!ready()) return;
  const normalized = email?.trim().toLowerCase();
  if (FB_PIXEL_ID && normalized) {
    // Re-init augments the pixel with Advanced Matching data; the library hashes
    // `em` before it is sent. Does not re-fire PageView.
    window.fbq!("init", FB_PIXEL_ID, { em: normalized });
  }
  window.fbq!("track", "Lead", { content_name: "newsletter_signup" });
};
