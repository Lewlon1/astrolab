-- ============================================
-- The Astro Psyche Lab — Analytics dashboard aggregation RPCs
-- Run this in the Supabase SQL Editor AFTER 009_analytics.sql.
--
-- Each function takes a [p_from, p_to) time window, excludes bot sessions,
-- and is EXECUTE-able only by the authenticated admin (revoked from anon).
-- SECURITY DEFINER + a pinned search_path keeps raw rows admin-only while
-- returning small aggregate payloads.
-- ============================================

-- a) Overview KPIs → single JSON object
CREATE OR REPLACE FUNCTION analytics_overview(p_from timestamptz, p_to timestamptz)
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
  );
$$;

-- b) Average dwell time per section → the headline "time reading each section" metric
CREATE OR REPLACE FUNCTION analytics_section_dwell(p_from timestamptz, p_to timestamptz)
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
  WHERE e.created_at >= p_from AND e.created_at < p_to AND e.section IS NOT NULL
    AND e.session_key IN (SELECT session_key FROM analytics_sessions WHERE is_bot = false)
  GROUP BY e.section
  ORDER BY avg_dwell_ms DESC;
$$;

-- c) Top clicked events
CREATE OR REPLACE FUNCTION analytics_top_clicks(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(event_name text, clicks bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_name, count(*)::bigint AS clicks
  FROM analytics_events
  WHERE event_type = 'click' AND created_at >= p_from AND created_at < p_to
    AND session_key IN (SELECT session_key FROM analytics_sessions WHERE is_bot = false)
  GROUP BY event_name
  ORDER BY clicks DESC
  LIMIT 20;
$$;

-- d) Conversion funnel → distinct sessions reaching each stage, as JSON
CREATE OR REPLACE FUNCTION analytics_funnel(p_from timestamptz, p_to timestamptz)
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
  );
$$;

-- e) Lock down execution: admin (authenticated) only.
REVOKE ALL ON FUNCTION analytics_overview(timestamptz, timestamptz)      FROM public, anon;
REVOKE ALL ON FUNCTION analytics_section_dwell(timestamptz, timestamptz) FROM public, anon;
REVOKE ALL ON FUNCTION analytics_top_clicks(timestamptz, timestamptz)    FROM public, anon;
REVOKE ALL ON FUNCTION analytics_funnel(timestamptz, timestamptz)        FROM public, anon;

GRANT EXECUTE ON FUNCTION analytics_overview(timestamptz, timestamptz)      TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_section_dwell(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_top_clicks(timestamptz, timestamptz)    TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_funnel(timestamptz, timestamptz)        TO authenticated;
