// Server-only by convention. Reads the experiment assignment for an /api/apply request.
// The lp_v / lp_qa cookies (set by middleware on /apply/*) are authoritative; the
// body's value is only a fallback for browsers that drop cookies.
import { QA_COOKIE, VARIANT_COOKIE, isVariant, type Variant } from "@/lib/experiments";

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function variantFromRequest(request: Request, bodyVariant: unknown): { lp_variant: Variant; qa: boolean } {
  const cookie = request.headers.get("cookie");
  const c = readCookie(cookie, VARIANT_COOKIE);
  const lp_variant: Variant = isVariant(c) ? c : isVariant(bodyVariant) ? bodyVariant : "a";
  return { lp_variant, qa: readCookie(cookie, QA_COOKIE) === "1" };
}
