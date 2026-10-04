// BookingsRepo backed by the Supabase `bookings` table (migration 014).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BookingsRepo } from "@/lib/payments/types";

type Result = { data: unknown; error: { message: string } | null };

async function row(query: PromiseLike<Result>): Promise<Booking | null> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Booking | null) ?? null;
}

async function mustRow(query: PromiseLike<Result>): Promise<Booking> {
  const booking = await row(query);
  if (!booking) throw new Error("Booking write returned no row");
  return booking;
}

export function supabaseBookingsRepo(db: SupabaseClient): BookingsRepo {
  const table = () => db.from("bookings");
  return {
    findById: (id) => row(table().select("*").eq("id", id).maybeSingle()),
    findByCalUid: (uid) => row(table().select("*").eq("cal_uid", uid).maybeSingle()),
    findByStripeSession: (sessionId) =>
      row(table().select("*").eq("stripe_session_id", sessionId).maybeSingle()),
    insert: (fields) => mustRow(table().insert(fields).select("*").single()),
    update: (id, patch) =>
      mustRow(
        table()
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("*")
          .single()
      ),
    async remove(id) {
      const { error } = await table().delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
