-- ============================================================================
-- Lead Queue + Daily Actions (admin tool #5)
--
-- RUN THIS MANUALLY in the Supabase dashboard SQL editor.
-- It is deliberately NOT in supabase/migrations/ — this session applies no
-- migrations. Every statement is idempotent, so re-running is safe.
--
-- Design note: this EXTENDS the existing `leads` and `engagement_accounts`
-- tables rather than introducing parallel `lead_profiles` / `engagement_targets`
-- tables. The existing tables already carry the conversion stages
-- (voice_note_sent / nurturing / booked / converted) and the 10 curated
-- Barcelona accounts seeded in migration 008.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. leads — queue columns
-- ----------------------------------------------------------------------------

ALTER TABLE leads ADD COLUMN IF NOT EXISTS ig_handle        text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS language         text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mailerlite_id    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manychat_id      text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags             text[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed     boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS subscribed_at    timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_actioned_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_synced_at   timestamptz;

-- The `source` CHECK from migration 001 does not allow rows arriving from a
-- MailerLite sync or a ManyChat CSV import. Widen it.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN (
    'website_form', 'lovecode', 'event_qr', 'manychat',
    'mailerlite', 'csv_import'
  ));

-- Email is the primary merge key for both MailerLite sync and CSV upload.
-- Stored lower-cased by the application; this index enforces the uniqueness
-- the upsert relies on.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_unique
  ON leads (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_ig_handle_unique
  ON leads (lower(ig_handle)) WHERE ig_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_language      ON leads (language);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads (last_activity_at DESC);


-- ----------------------------------------------------------------------------
-- 2. lead_events — behavioural timeline that scoring reads from
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lead_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid REFERENCES leads(id) ON DELETE CASCADE,
  type        text NOT NULL,
  -- subscribed | opened | clicked | pricing_click | booking | unsubscribed
  -- | story_reply | code_delivered | csv_import | actioned | note
  detail      jsonb DEFAULT '{}'::jsonb,
  source      text,              -- mailerlite | manychat | website | admin
  occurred_at timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events (lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events (type, occurred_at DESC);

-- A MailerLite re-sync must not duplicate activity already recorded. The
-- application sets a stable dedupe_key for anything it replays.
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS dedupe_key text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_events_dedupe
  ON lead_events (dedupe_key) WHERE dedupe_key IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 3. lead_scoring_config — weights are config, not code
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lead_scoring_config (
  key         text PRIMARY KEY,
  value       numeric NOT NULL,
  label       text NOT NULL,
  description text,
  sort_order  int DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

-- Starting weights. UNVALIDATED — this rubric is a guess and is expected to be
-- retuned from the config panel once real data lands. Nothing in the engine
-- hard-codes these numbers.
INSERT INTO lead_scoring_config (key, value, label, description, sort_order) VALUES
  ('recency_decay_days',   30, 'Recency half-life (days)', 'Activity older than this counts progressively less.', 1),
  ('w_pricing_click',      30, 'Pricing click',            'Viewed pricing but has not booked — strongest buying signal.', 2),
  ('w_story_reply',        25, 'Story reply',              'Replied to a story — an open conversation.', 3),
  ('w_code_delivered',     20, 'Love code delivered',      'Received their code; the follow-up window is open.', 4),
  ('w_email_click',        12, 'Email link click',         'Clicked a link in a campaign.', 5),
  ('w_email_open',          4, 'Email open',               'Opened a campaign.', 6),
  ('w_event_attended',     18, 'Attended an event',        'Met Gabs in person.', 7),
  ('w_manychat_optin',     10, 'ManyChat opt-in',          'Came in through an IG flow.', 8),
  ('w_stage_new',           5, 'Stage: new',               'Bonus applied while the lead is still unworked.', 9),
  ('w_stage_voice_note',   15, 'Stage: voice note sent',   'Awaiting a reply to a voice note.', 10),
  ('w_stage_nurturing',    10, 'Stage: nurturing',         'In the nurture sequence.', 11),
  ('w_stage_booked',        0, 'Stage: booked',            'Already booked — drops out of the conversion queue.', 12),
  ('w_stage_converted',     0, 'Stage: converted',         'Converted — no longer queued.', 13),
  ('penalty_unsubscribed', 50, 'Unsubscribed penalty',     'Subtracted when a lead has unsubscribed.', 14),
  ('penalty_recent_touch', 20, 'Recently actioned penalty','Subtracted if actioned in the last 3 days, to avoid pestering.', 15)
ON CONFLICT (key) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 4. action_items — the daily batch
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS action_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL,
  target_id     uuid REFERENCES engagement_accounts(id) ON DELETE SET NULL,
  tier          smallint NOT NULL,   -- 1 conversion | 2 ritual | 3 engagement | 4 maintenance
  type          text NOT NULL,
  title         text NOT NULL,
  reason        text,                -- human-readable "why this, why now"
  est_minutes   int DEFAULT 5,
  link          text,
  status        text DEFAULT 'pending'
                CHECK (status IN ('pending', 'done', 'skipped', 'expired')),
  generated_for date NOT NULL,
  batch         int NOT NULL DEFAULT 1,
  dedupe_key    text NOT NULL,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- One instance of a given action per day, across all batches. This is what
-- makes "first request of the day generates batch 1, refreshes return it"
-- safe under concurrent requests.
CREATE UNIQUE INDEX IF NOT EXISTS idx_action_items_dedupe
  ON action_items (generated_for, dedupe_key);

CREATE INDEX IF NOT EXISTS idx_action_items_day    ON action_items (generated_for DESC, batch);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items (status, generated_for DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_lead   ON action_items (lead_id, status);


-- ----------------------------------------------------------------------------
-- 5. engagement_accounts — rotation support for Tier 3
-- ----------------------------------------------------------------------------

ALTER TABLE engagement_accounts ADD COLUMN IF NOT EXISTS last_engaged_at date;
ALTER TABLE engagement_accounts ADD COLUMN IF NOT EXISTS category        text;
ALTER TABLE engagement_accounts ADD COLUMN IF NOT EXISTS notes           text;

CREATE INDEX IF NOT EXISTS idx_engagement_accounts_rotation
  ON engagement_accounts (last_engaged_at NULLS FIRST) WHERE is_active = true;

-- Best-effort categorisation of the accounts seeded in migration 008.
-- Adjust freely — `category` is descriptive only, rotation ignores it.
UPDATE engagement_accounts SET category = 'practitioner'
  WHERE category IS NULL AND niche IN ('Astrology', 'Divination', 'Spirituality');
UPDATE engagement_accounts SET category = 'venue'
  WHERE category IS NULL AND niche IN ('Wellness', 'Mindfulness');
UPDATE engagement_accounts SET category = 'warm_follower'
  WHERE category IS NULL;


-- ----------------------------------------------------------------------------
-- 6. ritual_calendar — Tier 2 fixtures
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ritual_calendar (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  type        text NOT NULL DEFAULT 'story_ritual',
  reason      text,
  weekday     int CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday; NULL for one-offs
  on_date     date,                                 -- for one-offs (event beats)
  est_minutes int DEFAULT 15,
  link        text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT ritual_calendar_when_check
    CHECK (weekday IS NOT NULL OR on_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ritual_calendar_weekday ON ritual_calendar (weekday) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_ritual_calendar_date    ON ritual_calendar (on_date) WHERE active = true;

-- Seed: the two weekly fixtures named in the session prompt.
-- NOTE: est_minutes and the reason strings are provisional — RITUAL_SPEC_weekly_story_reply.md
-- and the Sunday batch playbook are not in this repo, so the detail behind these
-- two rows has not been verified. Confirm before relying on the time budget.
INSERT INTO ritual_calendar (title, type, reason, weekday, est_minutes)
SELECT 'Weekly story ritual', 'story_ritual',
       'Tuesday fixture — the story-reply ritual is what turns passive viewers into conversations.',
       2, 20
WHERE NOT EXISTS (SELECT 1 FROM ritual_calendar WHERE type = 'story_ritual' AND weekday = 2);

INSERT INTO ritual_calendar (title, type, reason, weekday, est_minutes)
SELECT 'Batch session prep', 'batch_prep',
       'Sunday fixture — prepping the week''s batch is what stops mid-week content scramble.',
       0, 20
WHERE NOT EXISTS (SELECT 1 FROM ritual_calendar WHERE type = 'batch_prep' AND weekday = 0);


-- ----------------------------------------------------------------------------
-- 7. RLS — matches the convention established in migration 007
--    (public gets nothing on these tables; authenticated admin gets full access)
-- ----------------------------------------------------------------------------

ALTER TABLE lead_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_calendar     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin: full access" ON lead_events;
CREATE POLICY "Admin: full access" ON lead_events
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin: full access" ON lead_scoring_config;
CREATE POLICY "Admin: full access" ON lead_scoring_config
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin: full access" ON action_items;
CREATE POLICY "Admin: full access" ON action_items
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin: full access" ON ritual_calendar;
CREATE POLICY "Admin: full access" ON ritual_calendar
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
