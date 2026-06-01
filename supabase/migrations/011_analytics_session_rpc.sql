-- ============================================
-- The Astro Psyche Lab — First-touch session writer (fixes silent 0s)
-- Run this in the Supabase SQL Editor AFTER 009_analytics.sql.
--
-- Why: /api/analytics wrote the session row with a PostgREST upsert
-- (.upsert(..., { ignoreDuplicates: true })). Under RLS that takes an
-- ON CONFLICT DO UPDATE path, whose WITH CHECK is the admin-only
-- `auth.role() = 'authenticated'` clause — so anonymous visitors' session
-- rows were rejected ("new row violates row-level security policy for
-- table analytics_sessions"). Events (a plain INSERT) still landed, so the
-- dashboard had 80 events but 0 sessions, and every RPC — which joins
-- through analytics_sessions — aggregated to 0.
--
-- Fix: a SECURITY DEFINER function that performs a genuine
-- INSERT ... ON CONFLICT DO NOTHING. It runs as the owner (bypassing RLS),
-- keeps the session row first-touch/immutable to anon, and needs no UPDATE
-- policy and no service-role key. The route calls it via rpc().
-- ============================================

CREATE OR REPLACE FUNCTION public.analytics_touch_session(
  p_session_key   text,
  p_device        text    DEFAULT 'unknown',
  p_is_bot        boolean DEFAULT false,
  p_country       text    DEFAULT NULL,
  p_landing_path  text    DEFAULT NULL,
  p_referrer      text    DEFAULT NULL,
  p_referrer_host text    DEFAULT NULL,
  p_utm_source    text    DEFAULT NULL,
  p_utm_medium    text    DEFAULT NULL,
  p_utm_campaign  text    DEFAULT NULL,
  p_utm_term      text    DEFAULT NULL,
  p_utm_content   text    DEFAULT NULL,
  p_lang          text    DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.analytics_sessions (
    session_key, device, is_bot, country,
    landing_path, referrer, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, lang
  ) VALUES (
    p_session_key,
    coalesce(p_device, 'unknown'),
    coalesce(p_is_bot, false),
    p_country,
    p_landing_path, p_referrer, p_referrer_host,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content, p_lang
  )
  ON CONFLICT (session_key) DO NOTHING;
$$;

-- Anonymous visitors (and the admin) may create their own first-touch row, but
-- the function only ever inserts-or-ignores — never updates or reads back.
REVOKE ALL ON FUNCTION public.analytics_touch_session(
  text, text, boolean, text, text, text, text, text, text, text, text, text, text
) FROM public;
GRANT EXECUTE ON FUNCTION public.analytics_touch_session(
  text, text, boolean, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;
