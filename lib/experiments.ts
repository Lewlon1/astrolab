// Landing-page split test (round 1). Pure helpers, safe on the edge, server and client.
// Assignment happens in middleware.ts on /apply/* only.

export const EXPERIMENT_ID = "lp_r1";
export const VARIANT_COOKIE = "lp_v";
export const QA_COOKIE = "lp_qa";
/** Request headers middleware sets so the page sees the variant on the very first hit. */
export const VARIANT_HEADER = "x-lp-variant";
export const QA_HEADER = "x-lp-qa";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Variant = "a" | "b";

export const isVariant = (v: unknown): v is Variant => v === "a" || v === "b";

export type Assignment = {
  variant: Variant;
  qa: boolean;
  /** Write lp_v with this value (null = leave the cookie alone). */
  setVariantCookie: Variant | null;
  /** Write lp_qa=1. */
  setQaCookie: boolean;
};

/**
 * Decides the variant for one /apply request.
 * - `?v=a|b` forces it and flags the browser as QA.
 * - LP_SPLIT=off sends everyone to A and writes nothing.
 * - Otherwise an existing lp_v cookie wins; a first visit gets a 50/50 draw.
 */
export function assignVariant(input: {
  cookie: string | undefined;
  qaCookie: string | undefined;
  override: string | null;
  splitOff: boolean;
  random?: () => number;
}): Assignment {
  const qaBefore = input.qaCookie === "1";
  const override = input.override?.trim().toLowerCase();
  if (isVariant(override)) {
    return { variant: override, qa: true, setVariantCookie: override, setQaCookie: !qaBefore };
  }
  if (input.splitOff) return { variant: "a", qa: qaBefore, setVariantCookie: null, setQaCookie: false };
  if (isVariant(input.cookie)) {
    return { variant: input.cookie, qa: qaBefore, setVariantCookie: null, setQaCookie: false };
  }
  const variant: Variant = (input.random ?? Math.random)() < 0.5 ? "a" : "b";
  return { variant, qa: qaBefore, setVariantCookie: variant, setQaCookie: false };
}

type Getter = { get(name: string): string | null | undefined };
type CookieGetter = { get(name: string): { value: string } | undefined };

/** Server components: header from middleware first (first hit), then the cookie, else A. */
export function getVariant(headers: Getter, cookies: CookieGetter): Variant {
  const h = headers.get(VARIANT_HEADER);
  if (isVariant(h)) return h;
  const c = cookies.get(VARIANT_COOKIE)?.value;
  return isVariant(c) ? c : "a";
}

export function isQa(headers: Getter, cookies: CookieGetter): boolean {
  const h = headers.get(QA_HEADER);
  if (h === "1") return true;
  if (h === "0") return false;
  return cookies.get(QA_COOKIE)?.value === "1";
}
