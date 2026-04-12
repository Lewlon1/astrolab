// Database row types (matching Supabase schema)

export interface Service {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  price_label: string | null;
  duration: string | null;
  description: string | null;
  short_description: string | null;
  tag: string | null;
  calendly_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  service_name: string | null;
  quote: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  pillar: "Decode" | "Reframe" | "Navigate" | "Align" | null;
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  reading_time_min: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  event_type: "workshop" | "cosmic_tasters" | "collab" | "popup" | null;
  description: string | null;
  date: string | null;
  location: string | null;
  price: number | null;
  price_label: string | null;
  capacity: number | null;
  eventbrite_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string;
  source: "website_form" | "lovecode" | "event_qr" | "manychat" | null;
  status: "new" | "voice_note_sent" | "nurturing" | "booked" | "converted";
  notes: string | null;
  created_at: string;
}

// Component prop types

export interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href: string }[];
}

export interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export interface ServiceCardProps {
  service: Service;
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

export interface BlogPostCardProps {
  post: BlogPost;
}

export interface EventCardProps {
  event: Event;
}

// Content repurposer types

export type ContentChannel =
  | "instagram_carousel"
  | "instagram_caption"
  | "email_newsletter"
  | "reel_script"
  | "threads"
  | "pinterest";

export interface ContentQueueItem {
  id: string;
  blog_post_id: string | null;
  channel: ContentChannel;
  generated_content: string;
  status: "draft" | "edited" | "published";
  created_at: string;
  updated_at: string;
}

// Engagement dashboard types

export interface EngagementAccount {
  id: string;
  handle: string;
  platform: string;
  followers: string | null;
  niche: string | null;
  why_engage: string | null;
  is_active: boolean;
  created_at: string;
}

// Inspiration generator types

export interface ContentIdea {
  type: string;
  title: string;
  pillar: string;
  effort: string;
}

export interface TrendItem {
  topic: string;
  platform: string;
  heat: "Surging" | "Growing" | "Emerging" | "Sustained" | "Pre-trend";
  reach: string;
  niche: string;
  why_working: string;
  top_creators: string[];
  gabs_angle: string;
  content_ideas: ContentIdea[];
}

// Content repurposer types

export interface RepurposeResponse {
  instagram_carousel: {
    slides: string[];
    notes: string;
  };
  instagram_caption: {
    text: string;
    hashtags: string[];
    cta: string;
  };
  email_newsletter: {
    subject_line: string;
    preview_text: string;
    body: string;
  };
  reel_script: {
    hook: string;
    body: string;
    cta: string;
  };
  threads_post: {
    text: string;
  };
  pinterest_pin: {
    title: string;
    description: string;
  };
}
