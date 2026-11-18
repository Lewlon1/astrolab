-- ============================================
-- The Astro Psyche Lab — notes capture, private photo bucket and storage policies
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 019 and 015.
-- It is not applied by any tool or CLI.
--
-- Split from 019 on purpose: the SQL editor runs a script as one transaction,
-- and policy changes on storage.objects can fail with "must be owner of table
-- objects", which would roll back everything in 019.
--
-- If this fails on ownership, create the bucket note-photos (private, not public)
-- and recreate these three policies through Dashboard -> Storage -> Policies
-- (bucket: note-photos), each for the authenticated role, with the conditions
-- shown below.
-- Requires public.is_admin() from 015. Photos are shown via short-lived signed URLs.
-- Safe to re-run.
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('note-photos', 'note-photos', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admin: upload note photos" ON storage.objects;
CREATE POLICY "Admin: upload note photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'note-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: read note photos" ON storage.objects;
CREATE POLICY "Admin: read note photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'note-photos' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: delete note photos" ON storage.objects;
CREATE POLICY "Admin: delete note photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'note-photos' AND public.is_admin());
