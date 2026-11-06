-- ============================================
-- The Astro Psyche Lab — reading feedback (thumbs up/down) and the signal views
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 016 and 014.
-- It is not applied by any tool or CLI. Test it on a local stack or a Supabase
-- dev branch first; do NOT apply it to production from an agent session.
--
-- Adds:
--   1. lab_reading_feedback        one vote per instant reading (keyed by the client's draw id)
--   2. lab_reading_signal          one row per vote, with what that visitor did next:
--                                  signed up -> clicked a booking button -> booked -> paid
--   3. lab_reading_signal_summary  rollups by card, card x relation and card x Sun sign,
--                                  with a weighted score
--
-- The reading is shown BEFORE the email gate, so a vote starts anonymous. The gate
-- route links it to the lab profile (lab_profile_id) when the visitor signs up.
-- Bookings are matched to a profile by email (bookings has no lab link), counting
-- only bookings made after the profile was created.
--
-- Writes go through the service role only. Admins read through RLS (public.is_admin(),
-- from 015): the views use security_invoker, so a signed-in non-admin sees zero rows
-- (lab_reading_feedback, lab_profiles, lead_events and bookings all filter to admins).
-- Safe to re-run.
-- ============================================

-- 1. lab_reading_feedback
CREATE TABLE IF NOT EXISTS lab_reading_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id         uuid NOT NULL,
  vote            smallint NOT NULL CHECK (vote IN (-1, 1)),
  card            text NOT NULL,
  shown           text[] NULL,            -- every card dealt with it (the draw shows six), for "chosen when shown"
  sun_sign        text NOT NULL,          -- "Leo" or "Leo or Virgo"
  moon_sign       text NOT NULL,          -- "Gemini" or "Gemini or Cancer"
  relation        text NOT NULL CHECK (relation IN ('mirror', 'agree', 'tension')),
  has_time        boolean NOT NULL DEFAULT false,
  src             text NULL,
  lab_profile_id  uuid NULL REFERENCES lab_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_reading_feedback_draw ON lab_reading_feedback (draw_id);
CREATE INDEX IF NOT EXISTS idx_lab_reading_feedback_profile ON lab_reading_feedback (lab_profile_id);
CREATE INDEX IF NOT EXISTS idx_lab_reading_feedback_card ON lab_reading_feedback (card, created_at DESC);

ALTER TABLE lab_reading_feedback ENABLE ROW LEVEL SECURITY;
-- Reads only for authenticated (filtered to admins by the policy below); no writes.
REVOKE ALL ON lab_reading_feedback FROM anon;
REVOKE INSERT, UPDATE, DELETE ON lab_reading_feedback FROM authenticated;
GRANT SELECT ON lab_reading_feedback TO authenticated;

DROP POLICY IF EXISTS "Lab: admin reads reading feedback" ON lab_reading_feedback;
CREATE POLICY "Lab: admin reads reading feedback" ON lab_reading_feedback
  FOR SELECT USING (public.is_admin());

-- Re-run safety for databases that ran an earlier draft of 018 (before the six-card deal).
ALTER TABLE lab_reading_feedback ADD COLUMN IF NOT EXISTS shown text[] NULL;

-- Bookings are matched by lower(attendee_email).
CREATE INDEX IF NOT EXISTS idx_bookings_attendee_email_lower ON bookings (lower(attendee_email));

-- 2. lab_reading_signal: one row per vote and what happened next.
CREATE OR REPLACE VIEW lab_reading_signal
WITH (security_invoker = true) AS
SELECT
  f.id,
  f.draw_id,
  f.card,
  f.sun_sign,
  f.moon_sign,
  f.relation,
  f.has_time,
  f.vote,
  f.src,
  f.created_at,
  (f.lab_profile_id IS NOT NULL) AS signed_up,
  COALESCE(EXISTS (
    SELECT 1 FROM lead_events e
    WHERE p.lead_id IS NOT NULL AND e.lead_id = p.lead_id AND e.type = 'lab_booking_clicked'
  ), false) AS booking_clicked,
  COALESCE(EXISTS (
    SELECT 1 FROM bookings b
    WHERE p.id IS NOT NULL
      AND lower(b.attendee_email) = lower(p.email)
      AND b.created_at >= p.created_at
      AND b.cal_status <> 'cancelled'
  ), false) AS booked,
  COALESCE(EXISTS (
    SELECT 1 FROM bookings b
    WHERE p.id IS NOT NULL
      AND lower(b.attendee_email) = lower(p.email)
      AND b.created_at >= p.created_at
      AND b.cal_status <> 'cancelled'
      AND b.payment_status IN ('paid', 'manual')
  ), false) AS paid,
  f.shown  -- last: CREATE OR REPLACE VIEW can only append columns
FROM lab_reading_feedback f
-- A deleted profile keeps signed_up but has no email left to match bookings against.
LEFT JOIN lab_profiles p ON p.id = f.lab_profile_id AND p.deleted_at IS NULL;

REVOKE ALL ON lab_reading_signal FROM anon;
GRANT SELECT ON lab_reading_signal TO authenticated;

-- 3. lab_reading_signal_summary
-- Score weights (tune here): thumbs down -1, thumbs up +1, signed up +2,
-- clicked a booking button +3, booked +5. "paid" is shown but not weighted on top
-- of "booked". level says which grouping a row is: 'card', 'relation' or 'sun'.
CREATE OR REPLACE VIEW lab_reading_signal_summary
WITH (security_invoker = true) AS
SELECT
  CASE
    WHEN GROUPING(relation) = 0 THEN 'relation'
    WHEN GROUPING(sun_sign) = 0 THEN 'sun'
    ELSE 'card'
  END AS level,
  card,
  relation,
  sun_sign,
  count(*)                                   AS votes,
  count(*) FILTER (WHERE vote = 1)           AS ups,
  count(*) FILTER (WHERE vote = -1)          AS downs,
  count(*) FILTER (WHERE signed_up)          AS signups,
  count(*) FILTER (WHERE booking_clicked)    AS booking_clicks,
  count(*) FILTER (WHERE booked)             AS bookings,
  count(*) FILTER (WHERE paid)               AS paid,
  sum(vote + 2 * signed_up::int + 3 * booking_clicked::int + 5 * booked::int) AS score
FROM lab_reading_signal
GROUP BY GROUPING SETS ((card), (card, relation), (card, sun_sign));

REVOKE ALL ON lab_reading_signal_summary FROM anon;
GRANT SELECT ON lab_reading_signal_summary TO authenticated;
