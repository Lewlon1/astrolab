-- =============================================================================
-- transit_drafts
-- Stores single-post content drafts generated for a specific transit.
--
-- RUN MANUALLY in the Supabase SQL editor. Do NOT add this as a numbered
-- migration. Lewis: paste into SQL editor → run → confirm in Tables.
-- =============================================================================

CREATE TABLE IF NOT EXISTS transit_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transit_id TEXT NOT NULL,
  transit_title TEXT NOT NULL,
  transit_date DATE NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('decode', 'reframe', 'relate', 'convert')),
  format TEXT NOT NULL CHECK (format IN ('reel', 'carousel', 'caption', 'story')),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'both')),
  angle TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transit_drafts_created_idx
  ON transit_drafts (created_at DESC);

ALTER TABLE transit_drafts ENABLE ROW LEVEL SECURITY;

-- Match the existing admin-tool RLS pattern from migrations/007_admin_rls_policies.sql.
CREATE POLICY "Admin: full access" ON transit_drafts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
