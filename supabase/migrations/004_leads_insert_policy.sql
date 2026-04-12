-- Allow anonymous users to insert into the leads table (for the website lead capture form)
CREATE POLICY "Allow public insert" ON leads FOR INSERT WITH CHECK (true);
