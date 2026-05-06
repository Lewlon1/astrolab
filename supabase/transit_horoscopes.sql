-- =============================================================================
-- transit_horoscopes
-- Stores 12-sign × Sun/Rising horoscope bundles (24 reads) generated for
-- qualifying transits. The full bundle is stored as JSONB for atomicity.
--
-- RUN MANUALLY in the Supabase SQL editor. Do NOT add this as a numbered
-- migration. Lewis: paste into SQL editor → run → confirm in Tables.
-- =============================================================================

CREATE TABLE IF NOT EXISTS transit_horoscopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transit_id TEXT NOT NULL,
  transit_title TEXT NOT NULL,
  transit_date DATE NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'both')),
  -- reads: JSON array of 24 entries shaped as
  --   { "sign": "Aries"|..., "placement": "sun"|"rising", "content": "..." }
  -- ordered Aries→Pisces, Sun then Rising for each sign.
  reads JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transit_horoscopes_created_idx
  ON transit_horoscopes (created_at DESC);

CREATE INDEX IF NOT EXISTS transit_horoscopes_transit_idx
  ON transit_horoscopes (transit_id);

ALTER TABLE transit_horoscopes ENABLE ROW LEVEL SECURITY;

-- Match the existing admin-tool RLS pattern from migrations/007_admin_rls_policies.sql.
CREATE POLICY "Admin: full access" ON transit_horoscopes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
