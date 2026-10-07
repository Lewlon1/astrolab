-- ============================================
-- 014: Pay-after-booking (Cal.com → Stripe Payment Link → Cal confirm)
-- Spec: docs/superpowers/specs/2026-10-04-booking-payment-verification-design.md
-- ============================================

-- Stripe Payment Link the client is sent to after booking. Opt-in per service:
-- empty = the service keeps its current booking behaviour.
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS payment_url text;

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- null = a Stripe payment we couldn't match to a booking
  cal_uid text UNIQUE,
  service_slug text,
  event_type_id integer,
  attendee_name text,
  attendee_email text,
  start_time timestamptz,
  end_time timestamptz,
  cal_status text NOT NULL DEFAULT 'pending'
    CHECK (cal_status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'manual')),
  payment_method_note text,
  stripe_session_id text UNIQUE,
  amount_paid_cents integer,
  currency text,
  promo_code text,
  discount_cents integer,
  paid_at timestamptz,
  confirmed_at timestamptz,
  confirm_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings (start_time);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Admins read (same pattern as 007). No anon access at all.
-- All writes happen only through the service role (webhooks, admin API),
-- which bypasses RLS.
DROP POLICY IF EXISTS "Admin: read bookings" ON bookings;
CREATE POLICY "Admin: read bookings" ON bookings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin: update bookings" ON bookings;
