-- ============================================
-- The Astro Psyche Lab — Lab profiles (The Lab Draw)
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 015
-- (it uses public.is_admin()). It is not applied by any tool or CLI.
--
-- Adds:
--   1. lab_profiles       one row per email: card, birth data, stored chart
--   2. lab_geocode_cache  Nominatim lookups (service role only)
--   3. lab_throttle       + lab_take_slot(): cross-instance rate slot for Nominatim
--   4. 'lab' as an allowed leads.source
--
-- Inserts and deletes on lab_profiles go through the service role only
-- (there are deliberately no insert/delete policies).
-- Safe to re-run.
-- ============================================

-- 1. lab_profiles
CREATE TABLE IF NOT EXISTS lab_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  email                text NOT NULL,
  lead_id              uuid NULL REFERENCES leads(id) ON DELETE SET NULL,
  card_drawn           text NOT NULL,
  birth_date           date NOT NULL,
  birth_time           time NULL,
  birth_place_text     text NOT NULL,
  lat                  double precision NOT NULL,
  lon                  double precision NOT NULL,
  tz                   text NOT NULL,
  birth_utc            timestamptz NOT NULL,
  positions            jsonb NOT NULL,
  src                  text NULL,
  consent_at           timestamptz NOT NULL,
  consent_text_version text NOT NULL,
  next_transit         text NULL,
  transit_peak_date    date NULL,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  deleted_at           timestamptz NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_profiles_email_unique
  ON lab_profiles (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lab_profiles_user ON lab_profiles (user_id);

ALTER TABLE lab_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lab: owner reads own profile" ON lab_profiles;
CREATE POLICY "Lab: owner reads own profile" ON lab_profiles
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Lab: owner updates own profile" ON lab_profiles;
CREATE POLICY "Lab: owner updates own profile" ON lab_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lab: admin reads all profiles" ON lab_profiles;
CREATE POLICY "Lab: admin reads all profiles" ON lab_profiles
  FOR SELECT USING (public.is_admin());

-- 2. lab_geocode_cache. RLS on, no policies: service role only.
CREATE TABLE IF NOT EXISTS lab_geocode_cache (
  query        text PRIMARY KEY,   -- normalised: lower-case, trimmed
  lat          double precision NOT NULL,
  lon          double precision NOT NULL,
  display_name text,
  tz           text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE lab_geocode_cache ENABLE ROW LEVEL SECURITY;

-- 3. lab_throttle + lab_take_slot(). RLS on, no policies.
CREATE TABLE IF NOT EXISTS lab_throttle (
  key     text PRIMARY KEY,
  last_at timestamptz NOT NULL
);
ALTER TABLE lab_throttle ENABLE ROW LEVEL SECURITY;

-- Atomically claims the slot for `p_key` if the last claim is older than
-- p_interval_ms. Returns true when the caller took the slot.
CREATE OR REPLACE FUNCTION lab_take_slot(p_key text, p_interval_ms int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  taken text;
BEGIN
  INSERT INTO lab_throttle AS t (key, last_at)
  VALUES (p_key, now())
  ON CONFLICT (key) DO UPDATE SET last_at = now()
    WHERE t.last_at < now() - (p_interval_ms * interval '1 millisecond')
  RETURNING t.key INTO taken;
  RETURN taken IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION lab_take_slot(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION lab_take_slot(text, int) TO service_role;

-- 4. Allow leads.source = 'lab'. Keeps every value from migration 013.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN (
    'website_form', 'lovecode', 'event_qr', 'manychat',
    'mailerlite', 'csv_import', 'lab'
  ));

-- ============================================
-- Checklist for Lewis (dashboard, not SQL):
--   [ ] Run 015 (and 015b) first, then this file.
--   [ ] Auth > Providers: enable Email sign-ups and magic link.
--   [ ] Auth > URL configuration: add <site>/auth/callback to the redirect allow-list.
--   [ ] MailerLite: create the group "Lab Profiles" and set MAILERLITE_LAB_GROUP_ID.
--   [ ] MailerLite: create custom fields lab_card, sun_sign, moon_sign,
--       next_transit, transit_peak_date.
--   [ ] Set NOMINATIM_USER_AGENT, e.g. AstropsycheLab/1.0 (contact@your-domain).
-- ============================================
