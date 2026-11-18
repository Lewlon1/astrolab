-- ============================================
-- The Astro Psyche Lab — notes capture (paper notes photographed into the admin)
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 015 (needs public.is_admin()).
-- It is not applied by any tool or CLI. Test it on a local stack or a Supabase
-- dev branch first; do NOT apply it to production from an agent session.
-- Run 019b_notes_storage.sql after this one (bucket + storage policies).
--
-- Adds:
--   1. note_captures  one row per photo session (possibly several pages), with the
--                     verbatim transcript from the model
--   2. notes          one row per distinct note found; area is editable, ai_area keeps
--                     what the model chose so the correction rate can be measured
--   3. note_tasks     to-dos found in (or added to) a note
--
-- Shared business record: no owner column. Admins only, through public.is_admin()
-- (from 015). The API uses the signed-in admin's session, not the service role.
-- Safe to re-run.
-- ============================================

-- 1. note_captures
CREATE TABLE IF NOT EXISTS note_captures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_paths     text[] NOT NULL DEFAULT '{}',   -- paths in the private note-photos bucket
  status          text NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'done', 'failed')),
  error           text NULL,
  raw_transcript  text NULL,                      -- full verbatim transcript from the model
  model           text NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz NULL
);

-- 2. notes
CREATE TABLE IF NOT EXISTS notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id    uuid NULL REFERENCES note_captures(id) ON DELETE SET NULL,
  area          text NOT NULL DEFAULT 'unsorted'
                CHECK (area IN ('clients', 'content', 'todo', 'money', 'business', 'personal', 'unsorted')),
  ai_area       text NULL
                CHECK (ai_area IS NULL OR ai_area IN ('clients', 'content', 'todo', 'money', 'business', 'personal', 'unsorted')),
  title         text NOT NULL DEFAULT '',
  body          text NOT NULL DEFAULT '',
  client_name   text NULL,
  written_on    date NULL,                        -- date written on the page, if any
  status        text NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox', 'filed', 'archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  search        tsvector GENERATED ALWAYS AS (
                  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))
                ) STORED
);

CREATE INDEX IF NOT EXISTS idx_notes_status_created ON notes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_area ON notes (area);
CREATE INDEX IF NOT EXISTS idx_notes_capture ON notes (capture_id);
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN (search);

-- No earlier migration defines an updated_at trigger function, so this one is new.
CREATE OR REPLACE FUNCTION public.notes_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION public.notes_set_updated_at();

-- 3. note_tasks
CREATE TABLE IF NOT EXISTS note_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  text        text NOT NULL,
  due_on      date NULL,
  done_at     timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_note_tasks_note ON note_tasks (note_id);
CREATE INDEX IF NOT EXISTS idx_note_tasks_done_due ON note_tasks (done_at, due_on);

-- RLS: admins only, all operations.
ALTER TABLE note_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tasks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON note_captures, notes, note_tasks FROM anon;

DROP POLICY IF EXISTS "Notes: admin manages captures" ON note_captures;
CREATE POLICY "Notes: admin manages captures" ON note_captures
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Notes: admin manages notes" ON notes;
CREATE POLICY "Notes: admin manages notes" ON notes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Notes: admin manages tasks" ON note_tasks;
CREATE POLICY "Notes: admin manages tasks" ON note_tasks
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
