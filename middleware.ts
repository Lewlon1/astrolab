import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_MAX_AGE,
  QA_COOKIE,
  QA_HEADER,
  VARIANT_COOKIE,
  VARIANT_HEADER,
  assignVariant,
} from "@/lib/experiments";

/** /apply/*: assign the landing-page variant. No auth here, so no Supabase session refresh. */
function applyVariant(request: NextRequest): NextResponse {
  const a = assignVariant({
    cookie: request.cookies.get(VARIANT_COOKIE)?.value,
    qaCookie: request.cookies.get(QA_COOKIE)?.value,
    override: request.nextUrl.searchParams.get("v"),
    // Acquisition Bible v3: page A only until the January retro. The 50/50 test runs only with LP_SPLIT=on.
    splitOff: process.env.LP_SPLIT !== "on",
  });

  const headers = new Headers(request.headers);
  headers.set(VARIANT_HEADER, a.variant);
  headers.set(QA_HEADER, a.qa ? "1" : "0");
  const res = NextResponse.next({ request: { headers } });

  const opts = { maxAge: COOKIE_MAX_AGE, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  if (a.setVariantCookie) res.cookies.set(VARIANT_COOKIE, a.setVariantCookie, opts);
  if (a.setQaCookie) res.cookies.set(QA_COOKIE, "1", opts);
  return res;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/apply/")) return applyVariant(request);
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
