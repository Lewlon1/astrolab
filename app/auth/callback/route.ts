// GET /auth/callback: finish the magic-link sign-in, then link the profile to the user.
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const OTP_TYPES: readonly string[] = ["magiclink", "email", "signup"];
const DEFAULT_NEXT = "/lab/profile";

function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return DEFAULT_NEXT;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNext(url.searchParams.get("next"));
  const fail = () => NextResponse.redirect(`${origin}/lab?auth=error`);

  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return fail();
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
      if (error) return fail();
    } else {
      return fail();
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return fail();

    if (user.email) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("lab_profiles")
        .update({ user_id: user.id })
        .eq("email", user.email.toLowerCase())
        .is("user_id", null)
        .is("deleted_at", null);
      if (error) console.error("[lab] profile link failed, code", error.code);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[lab] auth callback failed:", err instanceof Error ? err.name : "unknown");
    return fail();
  }
}
