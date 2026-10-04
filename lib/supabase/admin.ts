// Service-role Supabase client. Bypasses RLS — import ONLY from server code
// (API routes / webhooks), never from a component.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
