// Admin authorisation. Being signed in is NOT enough: the Lab sends magic links
// to the public, so only users listed in `admin_users` (via the SQL function
// public.is_admin(), migration 015) count as admins.
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current user and whether they are an admin.
 * Fails closed: if the RPC errors (e.g. migration 015 not run yet), the
 * user is treated as a non-admin.
 */
export async function getAdminUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; isAdmin: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data, error } = await supabase.rpc("is_admin");
  if (error) return { user, isAdmin: false };

  return { user, isAdmin: data === true };
}

/**
 * Guard for admin API routes. Returns `{ supabase, user }` for an admin, or a
 * NextResponse (401 no user, 403 not an admin) that the route should return.
 */
export async function requireAdminApi(): Promise<
  { supabase: SupabaseClient; user: User } | NextResponse
> {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { supabase, user };
}
