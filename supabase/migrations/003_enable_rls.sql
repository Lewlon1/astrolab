-- ============================================
-- Enable RLS + public read policies
-- ============================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON services FOR SELECT USING (true);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON testimonials FOR SELECT USING (true);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON blog_posts FOR SELECT USING (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON events FOR SELECT USING (true);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON leads FOR SELECT USING (true);

ALTER TABLE engagement_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON engagement_accounts FOR SELECT USING (true);

ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON content_queue FOR SELECT USING (true);
