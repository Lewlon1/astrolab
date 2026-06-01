-- ============================================
-- The Astro Psyche Lab — First-party, cookieless web analytics
-- Run this in the Supabase SQL Editor (same as migrations 001–008)
--
-- Model: anonymous visitors can ONLY INSERT (no UPDATE, no SELECT); the
-- authenticated admin gets full access. Mirrors 007_admin_rls_policies.sql.
-- No raw IP is ever stored (country is derived server-side from the Vercel
-- geo header, then discarded). Session identity is an ephemeral sessionStorage
-- UUID generated client-side — no persistent cookie/visitor id.
-- ============================================

-- 1. SESSIONS — one row per ephemeral session (created once via ON CONFLICT DO NOTHING).
--    Session duration is carried by a `session_end` analytics_event, NOT updated here,
--    so anonymous clients never need UPDATE/SELECT on this table.
CREATE TABLE analytics_sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key   text UNIQUE NOT NULL,              -- client crypto.randomUUID()
  started_at    timestamptz DEFAULT now(),
  landing_path  text,
  referrer      text,
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_term      text,
  utm_content   text,
  device        text CHECK (device IN ('mobile','tablet','desktop','bot','unknown')) DEFAULT 'unknown',
  country       text,                              -- 2-letter, from x-vercel-ip-country; raw IP never stored
  lang          text,
  is_bot        boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- 2. EVENTS — append-only fact rows.
CREATE TABLE analytics_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key text NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN (
                'page_view','session_start','session_end',
                'section_view','section_dwell','click','interaction','conversion')),
  event_name  text,
  path        text,
  section     text,
  dwell_ms    integer,
  props       jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz,                          -- client timestamp, validated/clamped server-side
  created_at  timestamptz DEFAULT now()
);

-- 3. Indexes for the dashboard aggregations
CREATE INDEX idx_an_events_session   ON analytics_events (session_key);
CREATE INDEX idx_an_events_type_time ON analytics_events (event_type, created_at DESC);
CREATE INDEX idx_an_events_name      ON analytics_events (event_name);
CREATE INDEX idx_an_events_section   ON analytics_events (section) WHERE section IS NOT NULL;
CREATE INDEX idx_an_sessions_started ON analytics_sessions (started_at DESC);

-- 4. RLS — mirror 007: anonymous INSERT only, authenticated (admin) full access,
--    and crucially NO public SELECT (anon cannot read anyone's analytics).
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: insert sessions" ON analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public: insert events"   ON analytics_events   FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin: full access" ON analytics_sessions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin: full access" ON analytics_events
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. Lead attribution columns (nullable → backwards compatible with existing rows/inserts).
--    Lets the dashboard answer "who signed up + where they came from + what they read".
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_key  text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_path text;
CREATE INDEX IF NOT EXISTS idx_leads_session_key ON leads (session_key);
