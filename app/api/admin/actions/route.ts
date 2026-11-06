/**
 * Daily Actions: fetch today's batch, generating batch 1 on the first request
 * of the day. Refreshes return the existing batch — generation is idempotent
 * per (generated_for, dedupe_key), enforced by a unique index.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { getOrCreateTodayBatch } from "@/lib/dailyActions";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  try {
    return NextResponse.json(await getOrCreateTodayBatch(supabase));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
