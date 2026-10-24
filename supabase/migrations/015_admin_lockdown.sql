-- ============================================
-- The Astro Psyche Lab — Admin lockdown
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 014.
-- It is not applied by any tool or CLI.
--
-- Why: every admin RLS policy so far trusted `auth.role() = 'authenticated'`,
-- i.e. ANY signed-in user. The Lab sends magic links to the public, so that
-- would make every visitor an admin. This migration:
--   1. adds an `admin_users` allow-list and a `public.is_admin()` check,
--   2. rewrites every authenticated-only policy to use `public.is_admin()`
--      (same names, same commands),
--   3. guards the admin analytics dashboard RPCs.
--
-- Safe to re-run. Deploy the app code and run this together: until this has
-- run, the app fails closed (is_admin() missing => nobody is admin).
-- ============================================

-- 1. admin_users allow-list. RLS on with NO policies: only the service role
--    and SECURITY DEFINER functions (is_admin below) can read it.
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Seed: every auth user that exists before the Lab launches is an admin.
--    Review the list in the dashboard after running, and delete any row that
--    should not be an admin.
INSERT INTO admin_users (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

-- Check the result:
-- SELECT u.email FROM admin_users a JOIN auth.users u ON u.id = a.user_id;

-- 3. is_admin(): true only for users in admin_users (false for anon).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) $$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 4. Table policies (migrations 007, 009, 013, transit_*.sql): "Admin: full access"

DROP POLICY IF EXISTS "Admin: full access" ON services;
CREATE POLICY "Admin: full access" ON services
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON blog_posts;
CREATE POLICY "Admin: full access" ON blog_posts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON events;
CREATE POLICY "Admin: full access" ON events
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON testimonials;
CREATE POLICY "Admin: full access" ON testimonials
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON leads;
CREATE POLICY "Admin: full access" ON leads
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON engagement_accounts;
CREATE POLICY "Admin: full access" ON engagement_accounts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON content_queue;
CREATE POLICY "Admin: full access" ON content_queue
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON analytics_sessions;
CREATE POLICY "Admin: full access" ON analytics_sessions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON analytics_events;
CREATE POLICY "Admin: full access" ON analytics_events
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON lead_events;
CREATE POLICY "Admin: full access" ON lead_events
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON lead_scoring_config;
CREATE POLICY "Admin: full access" ON lead_scoring_config
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON action_items;
CREATE POLICY "Admin: full access" ON action_items
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON ritual_calendar;
CREATE POLICY "Admin: full access" ON ritual_calendar
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON transit_drafts;
CREATE POLICY "Admin: full access" ON transit_drafts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin: full access" ON transit_horoscopes;
CREATE POLICY "Admin: full access" ON transit_horoscopes
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. bookings (migration 014): admins read; all writes use the service role.
DROP POLICY IF EXISTS "Admin: read bookings" ON bookings;
CREATE POLICY "Admin: read bookings" ON bookings
  FOR SELECT USING (public.is_admin());

-- 6. Storage (migration 012): service-images bucket writes.
--    NOTE: on some Supabase projects, policy changes on storage.objects fail in
--    the SQL editor with "must be owner of table objects". If so, make the same
--    three changes via Dashboard -> Storage -> service-images -> Policies,
--    using `public.is_admin()` in the expressions below.
DROP POLICY IF EXISTS "Admin: upload service images" ON storage.objects;
CREATE POLICY "Admin: upload service images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: update service images" ON storage.objects;
CREATE POLICY "Admin: update service images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: delete service images" ON storage.objects;
CREATE POLICY "Admin: delete service images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin());

-- 7. Analytics dashboard RPCs (migration 010). Bodies are unchanged except for
--    the `public.is_admin()` gate, so non-admins get empty/zero-row results.
--    Signatures and grants are identical. analytics_touch_session (011) is
--    deliberately NOT touched: anonymous visitors call it via POST /api/analytics.

CREATE OR REPLACE FUNCTION public.analytics_overview(p_from timestamptz, p_to timestamptz)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT session_key FROM analytics_sessions
    WHERE started_at >= p_from AND started_at < p_to AND is_bot = false
  ),
  pv AS (  -- page-view count per session (for bounce)
    SELECT session_key, count(*) AS n
    FROM analytics_events
    WHERE event_type = 'page_view' AND created_at >= p_from AND created_at < p_to
      AND session_key IN (SELECT session_key FROM s)
    GROUP BY session_key
  ),
  dur AS (  -- session duration from session_end events
    SELECT (props->>'duration_ms')::numeric AS d
    FROM analytics_events
    WHERE event_type = 'session_end' AND created_at >= p_from AND created_at < p_to
      AND session_key IN (SELECT session_key FROM s)
      AND props ? 'duration_ms'
  )
  SELECT json_build_object(
    'sessions',           (SELECT count(*) FROM s),
    'pageviews',          (SELECT coalesce(sum(n), 0) FROM pv),
    'avg_duration_ms',    (SELECT coalesce(round(avg(d)), 0) FROM dur),
    'median_duration_ms', (SELECT coalesce(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY d)), 0) FROM dur),
    'bounce_rate',        (SELECT CASE WHEN (SELECT count(*) FROM s) = 0 THEN 0
                            ELSE round(
                              100.0 * ((SELECT count(*) FROM s)
                                       - (SELECT count(*) FROM pv WHERE n > 1))
                              / (SELECT count(*) FROM s), 1)
                            END)
  )
  WHERE public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.analytics_section_dwell(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(section text, views bigint, avg_dwell_ms numeric, total_dwell_ms numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.section,
         count(*) FILTER (WHERE e.event_type = 'section_view')                       AS views,
         coalesce(round(avg(e.dwell_ms) FILTER (WHERE e.event_type = 'section_dwell')), 0) AS avg_dwell_ms,
         coalesce(sum(e.dwell_ms) FILTER (WHERE e.event_type = 'section_dwell'), 0)        AS total_dwell_ms
  FROM analytics_events e
  WHERE public.is_admin()
    AND e.created_at >= p_from AND e.created_at < p_to AND e.section IS NOT NULL
    AND e.session_key IN (SELECT session_key FROM analytics_sessions WHERE is_bot = false)
  GROUP BY e.section
  ORDER BY avg_dwell_ms DESC;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_clicks(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(event_name text, clicks bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_name, count(*)::bigint AS clicks
  FROM analytics_events
  WHERE public.is_admin()
    AND event_type = 'click' AND created_at >= p_from AND created_at < p_to
    AND session_key IN (SELECT session_key FROM analytics_sessions WHERE is_bot = false)
  GROUP BY event_name
  ORDER BY clicks DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.analytics_funnel(p_from timestamptz, p_to timestamptz)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ev AS (
    SELECT * FROM analytics_events
    WHERE created_at >= p_from AND created_at < p_to
      AND session_key IN (SELECT session_key FROM analytics_sessions WHERE is_bot = false)
  )
  SELECT json_build_object(
    'visit',     (SELECT count(DISTINCT session_key) FROM ev WHERE event_type = 'session_start'),
    'engaged',   (SELECT count(DISTINCT session_key) FROM ev WHERE event_type = 'section_view'),
    'cta_click', (SELECT count(DISTINCT session_key) FROM ev
                   WHERE event_type = 'click' AND (event_name LIKE 'cta_book%' OR event_name LIKE 'cta_order%')),
    'lead',      (SELECT count(DISTINCT session_key) FROM ev
                   WHERE event_type = 'conversion' AND event_name IN ('newsletter_signup','booking_click')),
    'booking',   (SELECT count(DISTINCT session_key) FROM ev
                   WHERE event_type = 'conversion' AND event_name = 'booking_confirmed')
  )
  WHERE public.is_admin();
$$;

-- CREATE OR REPLACE keeps existing grants, but restate them so this file is
-- the source of truth: not anon, authenticated only (the gate does the rest).
REVOKE ALL ON FUNCTION public.analytics_overview(timestamptz, timestamptz)      FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_section_dwell(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_top_clicks(timestamptz, timestamptz)    FROM public, anon;
REVOKE ALL ON FUNCTION public.analytics_funnel(timestamptz, timestamptz)        FROM public, anon;

GRANT EXECUTE ON FUNCTION public.analytics_overview(timestamptz, timestamptz)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_section_dwell(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_clicks(timestamptz, timestamptz)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_funnel(timestamptz, timestamptz)        TO authenticated;
