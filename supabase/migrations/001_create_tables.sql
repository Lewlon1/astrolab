-- ============================================
-- The Astro Psyche Lab — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. SERVICES
CREATE TABLE services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price numeric,
  price_label text,
  duration text,
  description text,
  short_description text,
  tag text,
  calendly_url text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. TESTIMONIALS
CREATE TABLE testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  service_name text,
  quote text NOT NULL,
  is_featured boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. BLOG_POSTS
CREATE TABLE blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  pillar text CHECK (pillar IN ('Decode', 'Reframe', 'Navigate', 'Align')),
  featured_image_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  reading_time_min int,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. EVENTS
CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  event_type text CHECK (event_type IN ('workshop', 'cosmic_tasters', 'collab', 'popup')),
  description text,
  date timestamptz,
  location text,
  price numeric,
  price_label text,
  capacity int,
  eventbrite_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. LEADS
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text NOT NULL,
  source text CHECK (source IN ('website_form', 'lovecode', 'event_qr', 'manychat')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'voice_note_sent', 'nurturing', 'booked', 'converted')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. ENGAGEMENT_ACCOUNTS
CREATE TABLE engagement_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  handle text NOT NULL,
  platform text DEFAULT 'instagram',
  followers text,
  niche text,
  why_engage text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. CONTENT_QUEUE
CREATE TABLE content_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  channel text CHECK (channel IN ('instagram_carousel', 'instagram_caption', 'email_newsletter', 'reel_script', 'threads', 'pinterest')),
  generated_content text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'edited', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
