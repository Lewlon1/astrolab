-- ============================================
-- Services CMS: bilingual columns, booking link, photo upload
-- Run manually in the Supabase SQL editor BEFORE deploying the
-- code that ships with this migration (the new admin form writes
-- these columns; the old code is unaffected by them).
-- ============================================

-- 1. New columns on services
--    All nullable — the site falls back to the English column when
--    a Spanish value is empty, and hides the Book CTA when neither
--    a hardcoded booking target nor booking_url exists.
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS name_es text,
  ADD COLUMN IF NOT EXISTS tag_es text,
  ADD COLUMN IF NOT EXISTS short_description_es text,
  ADD COLUMN IF NOT EXISTS description_es text,
  ADD COLUMN IF NOT EXISTS price_label_es text,
  ADD COLUMN IF NOT EXISTS duration_es text;

COMMENT ON COLUMN services.calendly_url IS
  'DEPRECATED: superseded by booking_url. Kept so the previously deployed admin form (which still writes it) does not error mid-deploy. Drop in a later migration.';

-- 2. Public storage bucket for service photos (5 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. storage.objects policies for the bucket.
--    NOTE: on some Supabase projects, CREATE POLICY on storage.objects
--    fails in the SQL editor with "must be owner of table objects".
--    If that happens, create these same four policies via
--    Dashboard -> Storage -> service-images -> Policies instead.
CREATE POLICY "Public: read service images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-images');

CREATE POLICY "Admin: upload service images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Admin: update service images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images')
  WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Admin: delete service images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-images');

-- No table-RLS changes needed: 007_admin_rls_policies.sql already grants
-- "Admin: full access" (FOR ALL) on services and public read of active rows.
