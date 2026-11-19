-- lp_demo_report_v1.sql — where people drop off in variant A's Lab demo (lp_r1)
--
-- SELECT-ONLY. Run by hand in the Supabase SQL editor. Changes nothing.
-- Excludes QA visits (?v=) and bot sessions. One row per demo step:
--   1 Draw  = the demo scrolled into view
--   2 Map   = a card was picked
--   3 Read  = the reading was shown
--   4 Test  = the email was given and the practice step unlocked
-- Diagnostic only: the split-test decision still uses lp_report_v1.sql.

WITH a_views AS (
  SELECT count(DISTINCT e.session_key) AS n
    FROM analytics_events e
    LEFT JOIN analytics_sessions s ON s.session_key = e.session_key
   WHERE e.event_name = 'lp_view'
     AND e.props->>'experiment_id' = 'lp_r1'
     AND e.props->>'lp_variant' = 'a'
     AND COALESCE((e.props->>'qa')::boolean, false) = false
     AND COALESCE(s.is_bot, false) = false
),
steps AS (
  SELECT (e.props->>'step')::int AS step, count(DISTINCT e.session_key) AS sessions
    FROM analytics_events e
    LEFT JOIN analytics_sessions s ON s.session_key = e.session_key
   WHERE e.event_name = 'lp_demo_step'
     AND e.props->>'experiment_id' = 'lp_r1'
     AND e.props->>'lp_variant' = 'a'
     AND COALESCE((e.props->>'qa')::boolean, false) = false
     AND COALESCE(s.is_bot, false) = false
   GROUP BY 1
)
SELECT
  st.step,
  (ARRAY['Draw (seen)', 'Map (card picked)', 'Read (reading shown)', 'Test (email given)'])[st.step] AS stage,
  st.sessions,
  round(100.0 * st.sessions / NULLIF(v.n, 0), 1)                                  AS pct_of_a_visitors,
  round(100.0 * st.sessions / NULLIF(lag(st.sessions) OVER (ORDER BY st.step), 0), 1) AS pct_of_previous_step
FROM steps st CROSS JOIN a_views v
WHERE st.step BETWEEN 1 AND 4
ORDER BY st.step;
