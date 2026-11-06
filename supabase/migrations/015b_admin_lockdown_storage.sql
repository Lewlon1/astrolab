-- ============================================
-- The Astro Psyche Lab — Admin lockdown, storage policies
-- Run this MANUALLY in the Supabase SQL Editor (dashboard) AFTER 015.
-- It is not applied by any tool or CLI.
--
-- Split from 015 on purpose: the SQL editor runs a script as one transaction,
-- and policy changes on storage.objects can fail with "must be owner of table
-- objects", which would roll back everything in 015.
--
-- If this fails on ownership, recreate these three policies through
-- Dashboard -> Storage -> Policies (bucket: service-images), each for the
-- authenticated role, with the conditions shown below.
-- Requires public.is_admin() from 015.
-- ============================================

DROP POLICY IF EXISTS "Admin: upload service images" ON storage.objects;
CREATE POLICY "Admin: upload service images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: update service images" ON storage.objects;
CREATE POLICY "Admin: update service images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin: delete service images" ON storage.objects;
CREATE POLICY "Admin: delete service images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin());
