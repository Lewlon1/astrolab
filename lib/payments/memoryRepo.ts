// In-memory BookingsRepo for tests. Enforces the same uniqueness rules as the DB.

import type { Booking, BookingFields, BookingsRepo } from "@/lib/payments/types";

export function memoryRepo(): BookingsRepo & { rows: Booking[] } {
  const rows: Booking[] = [];
  let seq = 0;
  const unique = (row: Booking) => {
    for (const other of rows) {
      if (other.id === row.id) continue;
      if (row.cal_uid && other.cal_uid === row.cal_uid) throw new Error("duplicate cal_uid");
      if (row.stripe_session_id && other.stripe_session_id === row.stripe_session_id) {
        throw new Error("duplicate stripe_session_id");
      }
    }
  };

  return {
    rows,
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async findByCalUid(uid) {
      return rows.find((r) => r.cal_uid === uid) ?? null;
    },
    async findByStripeSession(sessionId) {
      return rows.find((r) => r.stripe_session_id === sessionId) ?? null;
    },
    async insert(fields: BookingFields) {
      const now = new Date().toISOString();
      const row: Booking = { ...fields, id: `b${++seq}`, created_at: now, updated_at: now };
      unique(row);
      rows.push(row);
      return row;
    },
    async update(id, patch) {
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error("not found");
      const next = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
      unique(next);
      rows[i] = next;
      return next;
    },
    async remove(id) {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
  };
}
