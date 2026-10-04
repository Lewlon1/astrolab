-- ============================================================================
-- Migration 014 — Lead Funnel alignment
--
-- RUN THIS MANUALLY in the Supabase dashboard SQL editor, AFTER migration 013
-- and BEFORE the code that ships with it goes live. Every statement is
-- idempotent, so re-running is safe.
--
-- Brings the schema in line with the Lead Funnel technical specification:
-- the cold/warm track, the gate fields, and the stage vocabulary
-- (lead / code_delivered / engaged / booked / client).
--
-- Design note: like 013, this EXTENDS `leads` rather than introducing the
-- spec's parallel `lead_profiles` table. lib/leadScoring.ts, lib/actionEngine.ts,
-- lib/dailyActions.ts and every admin route read `leads`; a rename would
-- re-point every FK in lead_events and action_items for a cosmetic win. The
-- spec's vocabulary is honoured everywhere it is *visible* — types, API, UI —
-- through lib/leadStages.ts, which is the only file that knows the stage column
-- is still called `status`.
--
-- Interaction with 013: safe in either order of re-running. 013 §7 (the
-- destructive dedupe) reads `CASE status WHEN 'converted' …`, which no longer
-- matches after §3.3 below — but §7f's unique index means duplicates cannot
-- recur once it has run, so §7 is a no-op on any re-run regardless of
-- vocabulary. Nothing here relies on state carried between statements: no DO
-- blocks, no helper tables. The Supabase SQL editor does not reliably preserve
-- those, which is what broke the second attempt at 013.
--
-- DESTRUCTIVE OPERATIONS IN THIS FILE:
--   §3.3  UPDATE leads SET status = <new vocabulary> — rewrites every row's
--         stage in place. §3.2 writes an audit lead_event first, so this is
--         reversible from data (see the appendix).
--   §4.2  UPDATE leads SET source = 'website' | 'event' — two pure renames.
--   §5    ALTER COLUMN email DROP NOT NULL — widening, not destructive.
-- No rows are deleted anywhere in this file. (013 §7 is the one that deletes.)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. track — cold | warm
--
-- Warm-track leads (events, referrals) skip code_delivered entirely and are
-- never eligible for a free-Code action. This column is what makes that
-- distinction expressible; without it the action engine cannot tell a stranger
-- from someone Gabs met in person.
-- ----------------------------------------------------------------------------

ALTER TABLE leads ADD COLUMN IF NOT EXISTS track text;

-- Every existing lead arrived through the website form or an import, so cold
-- is the correct historical default.
UPDATE leads SET track = 'cold' WHERE track IS NULL;

ALTER TABLE leads ALTER COLUMN track SET DEFAULT 'cold';
ALTER TABLE leads ALTER COLUMN track SET NOT NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_track_check;
ALTER TABLE leads ADD CONSTRAINT leads_track_check
  CHECK (track IN ('cold', 'warm'));


-- ----------------------------------------------------------------------------
-- 2. Gate fields
--
-- Cold gate: birth data is the qualification filter. Someone who hands over
-- their birth date has demonstrated intent a newsletter signup never does.
-- Warm gate: referred_by is what makes advocates visible.
-- ----------------------------------------------------------------------------

ALTER TABLE leads ADD COLUMN IF NOT EXISTS birth_date        date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS birth_time        time;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS birth_time_known  boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS birth_place       text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opening_question  text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp          text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by       text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_at        timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_version   text;

-- birth_time IS NULL alone is ambiguous: it cannot distinguish "we asked and
-- they don't know" (the spec permits this, and it changes how a chart is read)
-- from "we never asked because they came in before the gate existed".
-- birth_time_known carries that: true = known, false = asked and unknown,
-- NULL = never asked. Existing rows are correctly NULL.
COMMENT ON COLUMN leads.birth_time_known IS
  'true = time known; false = asked, unknown; NULL = never asked';

-- consent_version records WHICH wording was agreed to. A bare timestamp is not
-- defensible under GDPR once the consent copy changes.
COMMENT ON COLUMN leads.consent_version IS
  'Identifier of the consent copy the lead agreed to, e.g. gate-2026-08';


-- ----------------------------------------------------------------------------
-- 3. Stage vocabulary
--
--   new             -> lead
--   voice_note_sent -> code_delivered
--   nurturing       -> engaged
--   booked          -> booked      (unchanged)
--   converted       -> client
--
-- The column stays named `status`. 013 §7 contains four `CASE status WHEN …`
-- expressions and docs/LEAD_QUEUE_SETUP.md tells the operator 013 is
-- re-runnable; renaming the column would turn that instruction into an error.
-- ----------------------------------------------------------------------------

-- 3.1 Widen the CHECK FIRST, so 3.3 cannot violate the old constraint mid-flight.
--
--     The CHECK deliberately accepts BOTH vocabularies. This SQL is applied by
--     hand and the code deploys separately, so there is always a window where
--     one side is ahead of the other. A tolerant CHECK means neither ordering
--     can 500 the public newsletter form. Migration 015 tightens it once
--     `select distinct status from leads` shows only the new values.
--
--     DO NOT "tidy" this by dropping the legacy values here.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    -- spec vocabulary
    'lead', 'code_delivered', 'engaged', 'booked', 'client',
    -- legacy vocabulary, accepted until migration 015
    'new', 'voice_note_sent', 'nurturing', 'converted'
  ));

-- 3.2 Audit BEFORE rewriting, so the pre-migration value survives in data.
--     dedupe_key makes a re-run a no-op. Requires lead_events (migration 013).
INSERT INTO lead_events (lead_id, type, source, detail, occurred_at, dedupe_key)
SELECT
  l.id,
  'stage_migrated',
  'migration',
  jsonb_build_object(
    'from', l.status,
    'to', CASE l.status
            WHEN 'new'             THEN 'lead'
            WHEN 'voice_note_sent' THEN 'code_delivered'
            WHEN 'nurturing'       THEN 'engaged'
            WHEN 'converted'       THEN 'client'
            ELSE l.status
          END,
    'migration', '014'
  ),
  now(),
  'stage_migration:014:' || l.id
FROM leads l
WHERE l.status IN ('new', 'voice_note_sent', 'nurturing', 'converted')
ON CONFLICT (dedupe_key) DO NOTHING;

-- 3.3 Rewrite. The mapping is rank-preserving, so no lead moves backwards.
UPDATE leads SET status = 'lead'           WHERE status = 'new';
UPDATE leads SET status = 'code_delivered' WHERE status = 'voice_note_sent';
UPDATE leads SET status = 'engaged'        WHERE status = 'nurturing';
UPDATE leads SET status = 'client'         WHERE status = 'converted';
-- 'booked' is spelled the same in both vocabularies.

-- 3.4 "Stage never regresses" — enforced in the database, not in TypeScript.
--
--     There are four writers today (the admin queue POST, the flat-list PATCH,
--     the MailerLite sync, the ManyChat import) and two more arriving (the
--     Cal.com and Stripe webhooks). Enforcing this in each of them means every
--     future writer has to remember — which is exactly the failure mode the
--     spec's governing constraint forbids. One trigger covers all of them.
--
--     Escape hatch: an admin correcting a mis-set stage sets stage_override_at
--     in the SAME update. The trigger permits regression only when that column
--     changes, so a webhook or a sync can never take the hatch by accident.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_override_at timestamptz;

-- Accepts both vocabularies so the function is correct during the deploy window.
CREATE OR REPLACE FUNCTION lead_stage_rank(p_stage text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_stage
    WHEN 'lead'             THEN 1
    WHEN 'new'              THEN 1
    WHEN 'code_delivered'   THEN 2
    WHEN 'voice_note_sent'  THEN 2
    WHEN 'engaged'          THEN 3
    WHEN 'nurturing'        THEN 3
    WHEN 'booked'           THEN 4
    WHEN 'client'           THEN 5
    WHEN 'converted'        THEN 5
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION leads_no_stage_regression()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.stage_override_at IS NOT DISTINCT FROM OLD.stage_override_at
     AND lead_stage_rank(NEW.status) < lead_stage_rank(OLD.status)
  THEN
    -- Clamp rather than RAISE. A Cal.com or Stripe webhook that arrives out of
    -- order must get a 200 and move on; a 500 there means the provider retries
    -- forever and the booking silently never lands.
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_no_stage_regression ON leads;
CREATE TRIGGER trg_leads_no_stage_regression
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION leads_no_stage_regression();


-- ----------------------------------------------------------------------------
-- 4. source — the spec's six, PLUS the three import-provenance values that
--    app/api/admin/lead-queue/sync/route.ts and .../upload/route.ts already
--    write. Collapsing those into 'manual' would destroy real provenance and
--    force edits to both importers for no gain.
--
--    'website_form' and 'event_qr' are pure renames and are backfilled in 4.2;
--    they stay in the CHECK only until migration 015.
-- ----------------------------------------------------------------------------

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN (
    -- spec
    'website', 'lovecode', 'story_reply', 'event', 'referral', 'manual',
    -- import provenance, retained
    'manychat', 'mailerlite', 'csv_import',
    -- legacy, removed by migration 015
    'website_form', 'event_qr'
  ));

-- 4.2 The two pure renames.
UPDATE leads SET source = 'website' WHERE source = 'website_form';
UPDATE leads SET source = 'event'   WHERE source = 'event_qr';


-- ----------------------------------------------------------------------------
-- 5. email nullable — so a handle-only ManyChat row can become a lead.
--    Today app/api/admin/lead-queue/upload/route.ts skips those rows entirely
--    because email is NOT NULL, which silently drops IG opt-ins.
--
--    Postgres treats NULLs as distinct, so idx_leads_email_unique (013 §7f,
--    a plain column index) keeps working unchanged on a nullable column and
--    PostgREST can still name it as an upsert conflict target. No index change.
--
--    A row must still be identifiable by something.
-- ----------------------------------------------------------------------------

ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_identity_check;
ALTER TABLE leads ADD CONSTRAINT leads_identity_check
  CHECK (email IS NOT NULL OR ig_handle IS NOT NULL);


-- ----------------------------------------------------------------------------
-- 6. Indexes for the new query shapes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_leads_track        ON leads (track);
CREATE INDEX IF NOT EXISTS idx_leads_track_status ON leads (track, status);
CREATE INDEX IF NOT EXISTS idx_leads_created      ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_consent      ON leads (consent_at)
  WHERE consent_at IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 7. Scoring weights for the new vocabulary, and for the event types that the
--    gates and webhooks start writing.
--
--    lib/leadScoring.ts looks weights up by key, so the legacy w_stage_* rows
--    seeded by 013 become inert rather than wrong; migration 015 deletes them.
--
--    UNVALIDATED. This rubric is a guess, consistent with 013's, and is
--    expected to be retuned from the config panel once real data lands.
-- ----------------------------------------------------------------------------

INSERT INTO lead_scoring_config (key, value, label, description, sort_order) VALUES
  ('w_stage_lead',            5, 'Stage: lead',           'Captured, nothing sent yet.',                     20),
  ('w_stage_code_delivered', 15, 'Stage: code delivered', 'Code is out; the follow-up window is open.',      21),
  ('w_stage_engaged',        10, 'Stage: engaged',        'They replied or clicked — a live conversation.',  22),
  ('w_stage_booked',          0, 'Stage: booked',         'Booked — drops out of the conversion queue.',     23),
  ('w_stage_client',          0, 'Stage: client',         'Paid — no longer queued.',                        24),
  ('w_capture',               8, 'Gate submission',       'Filled in a gate form with real birth data.',     25),
  ('w_dm_reply',             25, 'DM reply',              'Replied to a DM — an open conversation.',         26),
  ('w_purchase',              0, 'Purchase',              'Money changed hands; no longer a lead.',          27),
  ('w_track_warm',           12, 'Warm track bonus',      'Referred or met in person — warmer by default.',  28)
ON CONFLICT (key) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 8. RLS — deliberately UNCHANGED.
--
-- The capture and webhook routes added alongside this migration use the service
-- role, which bypasses RLS entirely. Granting anon INSERT or UPDATE on `leads`
-- or `lead_events` would let anyone holding the public anon key — it ships in
-- the browser bundle — forge a `purchase` event and promote themselves to
-- 'client', or rewrite any lead's stage. Do not add those policies.
-- ----------------------------------------------------------------------------


-- ============================================================================
-- Appendix — read-only verification. Run AFTER; changes nothing.
--
--   -- New vocabulary only (no new / voice_note_sent / nurturing / converted):
--   select status, count(*) from leads group by status order by 2 desc;
--
--   -- No website_form / event_qr left:
--   select source, count(*) from leads group by source order by 2 desc;
--
--   -- All 'cold' until the warm gate goes live:
--   select track, count(*) from leads group by track;
--
--   -- Should equal the number of rows 3.3 changed:
--   select count(*) from lead_events where type = 'stage_migrated';
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid = 'public.leads'::regclass order by conname;
--
-- Rollback of §3.3 reads the audit trail written by §3.2. Note the override:
-- without stage_override_at the trigger clamps every row straight back.
--
--   update leads l
--      set status = e.detail->>'from',
--          stage_override_at = now()
--     from lead_events e
--    where e.lead_id = l.id
--      and e.type = 'stage_migrated'
--      and e.detail->>'migration' = '014';
-- ============================================================================
