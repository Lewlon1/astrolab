-- ========================================================================
-- ASTROLAB V1 — SERVICES DATA UPDATE
-- ========================================================================
-- Branch: astrolab-V1
-- Date:   2026-04-14
--
-- HOW TO RUN:
--   1. Open Supabase Studio for the production project
--   2. Go to: SQL Editor → New query
--   3. Paste the contents between BEGIN and COMMIT below
--   4. Review carefully before clicking "Run"
--   5. If anything looks wrong, use the ROLLBACK section below.
--
-- WHAT THIS DOES:
--   1. Renames the existing €65 "Stellar Insights" row → "Astro Psyche Blend"
--      (keeps same UUID + historical sessions intact)
--   2. Inserts a NEW €120 "Stellar Insights" row
--   3. Inserts a NEW €75 "Soul Guided Travel Magazine" row
--
-- EXISTING SERVICES (left untouched):
--   - "Cosmic Quick Hit"   (€25)
--   - "Cosmic Alliance"    (€180)
--   - any other Star-Crossed / Cosmic Check-In / freebie tiers
--
-- After running, optionally visit /admin/services to:
--   - Adjust each new service's `calendly_url` (currently set to the
--     generic 30-min link as a placeholder)
--   - Set `tag = 'Most popular'` if applicable
--   - Reorder via sort_order
-- ========================================================================

BEGIN;

-- 1. Rename existing "Stellar Insights" (€65) → "Astro Psyche Blend"
UPDATE services
SET name = 'Astro Psyche Blend',
    slug = 'astro-psyche-blend',
    short_description = 'This is where you meet yourself. Your foundation. Your clarity. Your starting point.',
    description = 'Full natal chart illuminated. Core personality patterns. Shadow work foundations. 60-minute session.',
    sort_order = 2,
    updated_at = now()
WHERE slug = 'stellar-insights'
  AND price = 65;

-- 2. Insert NEW "Stellar Insights" at €120
INSERT INTO services
  (name, slug, price, price_label, duration, short_description, description,
   tag, calendly_url, sort_order, is_active)
VALUES
  ('Stellar Insights',
   'stellar-insights',
   120,
   '€120',
   '90 minutes',
   'This is where things start making sense. Your patterns connect. Your path becomes clearer.',
   'The "why" behind your patterns. Career + purpose deep-dive. Psychological pattern work. 90-minute session.',
   NULL,
   'https://calendly.com/astropsychelabadmi/30min',
   3,
   true);

-- 3. Insert "Soul Guided Travel Magazine" at €75
INSERT INTO services
  (name, slug, price, price_label, duration, short_description, description,
   tag, calendly_url, sort_order, is_active)
VALUES
  ('Soul Guided Travel Magazine',
   'soul-guided-travel-magazine',
   75,
   '€75',
   'Digital PDF',
   'The right places, at the right time, for the right version of your life.',
   'Top 5 destinations from your chart. Activities aligned to your transits. Optimal timing for each trip. Soul-purpose travel rituals. Digital PDF · delivered in 5 days.',
   'Digital Product',
   'https://calendly.com/astropsychelabadmi/30min',
   5,
   true);

COMMIT;

-- ========================================================================
-- ROLLBACK — run only if the above produced incorrect state
-- ========================================================================
-- BEGIN;
--
-- DELETE FROM services WHERE slug = 'soul-guided-travel-magazine';
-- DELETE FROM services WHERE slug = 'stellar-insights' AND price = 120;
--
-- UPDATE services
-- SET name = 'Stellar Insights',
--     slug = 'stellar-insights',
--     short_description = NULL,
--     description = NULL,
--     sort_order = 2,
--     updated_at = now()
-- WHERE slug = 'astro-psyche-blend' AND price = 65;
--
-- COMMIT;
