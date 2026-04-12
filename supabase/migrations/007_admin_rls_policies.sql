-- ============================================
-- Tighten RLS: public sees only published/active content
-- Authenticated (admin) gets full access to everything
-- ============================================

-- 1. Drop existing overly-permissive policies
DROP POLICY IF EXISTS "Allow public read" ON services;
DROP POLICY IF EXISTS "Allow public read" ON blog_posts;
DROP POLICY IF EXISTS "Allow public read" ON events;
DROP POLICY IF EXISTS "Allow public read" ON testimonials;
DROP POLICY IF EXISTS "Allow public read" ON leads;
DROP POLICY IF EXISTS "Allow public read" ON engagement_accounts;
DROP POLICY IF EXISTS "Allow public read" ON content_queue;
DROP POLICY IF EXISTS "Allow public insert" ON leads;

-- 2. Public (anon) SELECT policies — restricted
CREATE POLICY "Public: read active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public: read published posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public: read published events"
  ON events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public: read testimonials"
  ON testimonials FOR SELECT
  USING (true);

-- 3. Public INSERT on leads (for website forms)
CREATE POLICY "Public: submit leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- 4. Authenticated full access on ALL tables
CREATE POLICY "Admin: full access" ON services
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON blog_posts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON events
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON testimonials
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON leads
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON engagement_accounts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin: full access" ON content_queue
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
