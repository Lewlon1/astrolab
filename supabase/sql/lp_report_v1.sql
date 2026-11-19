-- lp_report_v1.sql — readout for the /apply split test (experiment lp_r1)
--
-- SELECT-ONLY. Run by hand in the Supabase SQL editor. Changes nothing.
-- Needs lp_variants_v1.sql to have been run (for nothing here except bookings
-- context; every number below comes from analytics_events and lead_events).
--
-- Excludes QA traffic (qa = true: visits that used ?v=a / ?v=b) and bot sessions.
--
-- Unit of "unique visitor": one analytics session (session_key). The site's
-- analytics are cookieless, and session_key lives in sessionStorage, so a person
-- who comes back in a new tab counts again. Both variants are counted the same
-- way, so the comparison is fair; the absolute rate is slightly understated.
--
-- Decision rule (see SESSION_NOTES, 2026-11-11):
--   * Don't read before 300 unique visitors per variant.
--   * If one variant's email rate >= 1.4x the other's AND its calls booked are
--     not lower, send 100% of traffic to it. Otherwise keep A and test heroes.
--   * Booked-call and close rates are not decision metrics before January.

WITH
-- 1. Ad spend per variant, entered by hand (GBP or USD; keep one currency).
--    Spend is per variant because the split happens on the site, not in Meta:
--    split each ad set's spend by that variant's share of its visitors.
spend (lp_variant, amount) AS (
  VALUES ('a', 0.00), ('b', 0.00)   -- TODO: fill in before reading
),

views AS (
  SELECT DISTINCT ON (e.session_key)
         e.session_key,
         e.props->>'lp_variant' AS lp_variant,
         e.props->>'concept'    AS concept,
         e.props->>'market'     AS market
    FROM analytics_events e
    LEFT JOIN analytics_sessions s ON s.session_key = e.session_key
   WHERE e.event_name = 'lp_view'
     AND e.props->>'experiment_id' = 'lp_r1'
     AND COALESCE((e.props->>'qa')::boolean, false) = false
     AND COALESCE(s.is_bot, false) = false
   ORDER BY e.session_key, e.occurred_at
),

-- One row per lead per milestone, attributed to the variant it saw at email time.
emails AS (
  SELECT DISTINCT ON (le.lead_id)
         le.lead_id,
         le.detail->>'lp_variant' AS lp_variant,
         le.detail->>'concept'    AS concept,
         le.detail->>'market'     AS market
    FROM lead_events le
   WHERE le.type = 'lp_email_captured'
     AND le.detail->>'experiment_id' = 'lp_r1'
     AND COALESCE((le.detail->>'qa')::boolean, false) = false
   ORDER BY le.lead_id, le.occurred_at
),
applications AS (
  SELECT DISTINCT le.lead_id FROM lead_events le
   WHERE le.type = 'lp_application_submitted' AND le.detail->>'experiment_id' = 'lp_r1'
),
calls AS (
  SELECT DISTINCT le.lead_id FROM lead_events le
   WHERE le.type = 'lp_call_booked' AND le.detail->>'experiment_id' = 'lp_r1'
),

funnel AS (
  SELECT e.lp_variant, e.concept, e.market,
         (a.lead_id IS NOT NULL) AS applied,
         (c.lead_id IS NOT NULL) AS booked
    FROM emails e
    LEFT JOIN applications a ON a.lead_id = e.lead_id
    LEFT JOIN calls c        ON c.lead_id = e.lead_id
),

v AS (
  SELECT lp_variant, concept, market, count(*) AS visitors
    FROM views GROUP BY GROUPING SETS ((lp_variant), (lp_variant, concept), (lp_variant, market))
),
f AS (
  SELECT lp_variant, concept, market,
         count(*)                         AS emails,
         count(*) FILTER (WHERE applied)  AS applications,
         count(*) FILTER (WHERE booked)   AS calls_booked
    FROM funnel GROUP BY GROUPING SETS ((lp_variant), (lp_variant, concept), (lp_variant, market))
)

SELECT
  CASE WHEN v.concept IS NULL AND v.market IS NULL THEN 'variant'
       WHEN v.concept IS NOT NULL THEN 'by concept'
       ELSE 'by market' END                                          AS cut,
  v.lp_variant,
  v.concept,
  v.market,
  v.visitors                                                         AS unique_visitors,
  COALESCE(f.emails, 0)                                              AS emails,
  round(100.0 * COALESCE(f.emails, 0) / NULLIF(v.visitors, 0), 1)    AS email_rate_pct,
  COALESCE(f.applications, 0)                                        AS applications,
  round(100.0 * COALESCE(f.applications, 0) / NULLIF(f.emails, 0), 1) AS application_rate_pct,
  COALESCE(f.calls_booked, 0)                                        AS calls_booked,
  -- Cost per email only makes sense for the whole variant (spend isn't split by concept here).
  CASE WHEN v.concept IS NULL AND v.market IS NULL
       THEN round(s.amount / NULLIF(f.emails, 0), 2) END             AS cost_per_email,
  (v.visitors >= 300)                                                AS past_300_visitors
FROM v
LEFT JOIN f ON f.lp_variant = v.lp_variant
           AND f.concept IS NOT DISTINCT FROM v.concept
           AND f.market  IS NOT DISTINCT FROM v.market
LEFT JOIN spend s ON s.lp_variant = v.lp_variant
ORDER BY cut DESC, v.lp_variant, v.concept NULLS FIRST, v.market NULLS FIRST;
