-- lp_variants_v1.sql — /apply landing-page split test (experiment lp_r1)
--
-- RUN BY HAND in the Supabase dashboard (SQL editor) for the "Astro lab" project.
-- Additive only: ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
-- No DROP, no data rewrites. Safe to run twice.
--
-- Until this runs, /api/apply still keeps every email (it falls back to a plain
-- lead and saves the application into leads.notes), but nothing is tagged with
-- the variant, so the readout can't use those rows.
--
-- Not changed on purpose:
-- * leads.source: /apply leads use the existing 'website_form' value, because a
--   new value would need DROP CONSTRAINT. They are identified by experiment_id.
-- * analytics_sessions: sessions are written by the analytics_touch_session RPC,
--   which would need replacing to fill new columns. Every lp_* analytics event
--   carries lp_variant / experiment_id / concept / market / qa in props instead,
--   and lp_report_v1.sql reads them from there.
-- * attribution_v1.sql was never written, so the bookings columns are added here.

-- 1. leads: experiment tags, the missing UTM columns, and the application.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lp_variant               text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS experiment_id            text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS concept                  text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS market                   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content              text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term                 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS application              jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS application_submitted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_experiment ON leads (experiment_id, lp_variant)
  WHERE experiment_id IS NOT NULL;

-- 2. bookings: link a Cal booking back to the lead and the variant.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lp_variant    text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS experiment_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS concept       text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS market        text;

-- 3. Readout speed: lp_* analytics events are filtered by event_name.
--    (idx_an_events_name from migration 009 already covers this; nothing to add.)

-- Check afterwards (should list 8 + 5 rows):
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND ((table_name = 'leads' AND column_name IN ('lp_variant','experiment_id','concept','market','utm_content','utm_term','application','application_submitted_at'))
--      OR (table_name = 'bookings' AND column_name IN ('lead_id','lp_variant','experiment_id','concept','market')))
--  ORDER BY 1, 2;
