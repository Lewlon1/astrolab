// Server-only by convention. Who is looking at a Lab profile?
//   1. a signed-in Supabase user (verified email) with a profile of their own, else
//   2. a signed lab_profile cookie for a profile that is still unclaimed.
// The cookie lets a visitor see the profile they just created before they have
// verified their email. It stops working the moment the profile is claimed.
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

export type LabViewer<T> = { via: "session" | "cookie"; row: T };

/** The raw lab_profile cookie, or undefined (also outside a request, e.g. in tests). */
export async function readLabCookie(): Promise<string | undefined> {
  try {
    return (await cookies()).get(SESSION_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

type Deps = {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  cookieValue?: string;
  /** Columns to select. Must include `id`. */
  columns: string;
  /** injectable clock (ms) for tests */
  now?: number;
};

export async function resolveLabViewer<T extends { id: string }>(deps: Deps): Promise<LabViewer<T> | null> {
  const { supabase, admin, columns } = deps;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (user) {
    const byUser = () =>
      admin.from("lab_profiles").select(columns).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
    let found = await byUser();
    if (found.error) throw new Error(`profile lookup failed (code ${found.error.code})`);
    // Fallback: link an unclaimed profile by (lower-cased) email, then reload.
    if (!found.data && user.email) {
      const link = await admin
        .from("lab_profiles")
        .update({ user_id: user.id })
        .eq("email", user.email.toLowerCase())
        .is("user_id", null)
        .is("deleted_at", null);
      if (link.error) console.error("[lab] profile link failed, code", link.error.code);
      found = await byUser();
      if (found.error) throw new Error(`profile lookup failed (code ${found.error.code})`);
    }
    if (found.data) return { via: "session", row: found.data as unknown as T };
  }

  const id = deps.cookieValue ? verifySession(deps.cookieValue, deps.now) : null;
  if (!id) return null;
  const res = await admin
    .from("lab_profiles")
    .select(columns)
    .eq("id", id)
    .is("user_id", null)
    .is("deleted_at", null)
    .maybeSingle();
  if (res.error) throw new Error(`profile lookup failed (code ${res.error.code})`);
  return res.data ? { via: "cookie", row: res.data as unknown as T } : null;
}
