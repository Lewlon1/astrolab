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
  /** @deprecated superseded by booking_url (migration 012). */
  calendly_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Added in migration 012 — optional so rows read before the migration
  // runs (or from an un-migrated database) stay type-safe.
  booking_url?: string | null;
  image_url?: string | null;
  name_es?: string | null;
  tag_es?: string | null;
  short_description_es?: string | null;
  description_es?: string | null;
  price_label_es?: string | null;
  duration_es?: string | null;
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
  // Attribution (added in migration 009 — nullable for older rows)
  session_key?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  landing_path?: string | null;
  // Lead Queue columns (sql/lead-queue-daily-actions.sql) — optional so rows
  // read before that SQL is applied stay type-safe.
  ig_handle?: string | null;
  language?: string | null;
  mailerlite_id?: string | null;
  manychat_id?: string | null;
  tags?: string[] | null;
  unsubscribed?: boolean | null;
  subscribed_at?: string | null;
  last_activity_at?: string | null;
  last_actioned_at?: string | null;
  last_synced_at?: string | null;
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
  // Added by sql/lead-queue-daily-actions.sql for Tier 3 rotation.
  last_engaged_at?: string | null;
  category?: string | null;
  notes?: string | null;
}

// ============================================
// Lead Queue + Daily Actions (admin tool #5)
// ============================================

export type LeadEventType =
  | "subscribed"
  | "opened"
  | "clicked"
  | "pricing_click"
  | "booking"
  | "unsubscribed"
  | "story_reply"
  | "code_delivered"
  | "csv_import"
  | "actioned"
  | "note";

export interface LeadEvent {
  id: string;
  lead_id: string | null;
  type: LeadEventType | string;
  detail: Record<string, unknown>;
  source: string | null;
  occurred_at: string;
  created_at: string;
  dedupe_key?: string | null;
}

export interface ScoringWeight {
  key: string;
  value: number;
  label: string;
  description: string | null;
  sort_order: number;
  updated_at: string;
}

/** Weights keyed for O(1) lookup, as the scoring engine consumes them. */
export type ScoringWeights = Record<string, number>;

/** One contributing term in a lead's score, kept so the UI can explain it. */
export interface ScoreFactor {
  key: string;
  label: string;
  points: number;
}

export interface ScoredLead {
  lead: Lead;
  score: number;
  factors: ScoreFactor[];
  /** Human-readable "why this lead is here". */
  reason: string;
  events: LeadEvent[];
}

export type ActionTier = 1 | 2 | 3 | 4;

export type ActionType =
  | "voice_note"
  | "follow_up"
  | "booking_nudge"
  | "story_reply_answer"
  | "story_ritual"
  | "batch_prep"
  | "event_beat"
  | "testimonial_ask"
  | "comment_engage"
  | "story_from_bank"
  | "save_references"
  | "update_testimonials";

export interface ActionItem {
  id: string;
  lead_id: string | null;
  target_id: string | null;
  tier: ActionTier;
  type: ActionType | string;
  title: string;
  reason: string | null;
  est_minutes: number;
  link: string | null;
  status: "pending" | "done" | "skipped" | "expired";
  generated_for: string;
  batch: number;
  dedupe_key: string;
  completed_at: string | null;
  created_at: string;
}

/** An action the engine has ranked but not yet written to the database. */
export type CandidateAction = Omit<
  ActionItem,
  "id" | "status" | "generated_for" | "batch" | "completed_at" | "created_at"
>;

export interface RitualCalendarItem {
  id: string;
  title: string;
  type: string;
  reason: string | null;
  weekday: number | null;
  on_date: string | null;
  est_minutes: number;
  link: string | null;
  active: boolean;
  created_at: string;
}

/**
 * The honesty banner. `message` states plainly how much real work is left so
 * the tool never implies there is more high-value work than there is.
 */
export interface TankStatus {
  tier1Remaining: number;
  tier2Remaining: number;
  tier3Remaining: number;
  /** True when tiers 1 and 2 are empty — the signal that stopping is correct. */
  highValueExhausted: boolean;
  /** True when the batch was cut short by the 45-minute budget. */
  timeCapped: boolean;
  message: string;
}

export interface ActionBatch {
  date: string;
  batch: number;
  items: ActionItem[];
  totalMinutes: number;
  tank: TankStatus;
  /** Regeneration is only offered once every item in the batch is resolved. */
  canRegenerate: boolean;
}

export interface MergeReport {
  totalRows: number;
  created: number;
  mergedByEmail: number;
  mergedByHandle: number;
  skipped: { row: number; reason: string }[];
  /** CSV headers the parser did not recognise, so nothing is silently dropped. */
  unmappedColumns: string[];
  mappedColumns: Record<string, string>;
}

export interface SyncReport {
  subscribersSeen: number;
  created: number;
  updated: number;
  eventsInserted: number;
  errors: string[];
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

// ============================================
// First-party analytics types (migrations 009 / 010)
// ============================================

export type AnalyticsEventType =
  | "page_view"
  | "session_start"
  | "session_end"
  | "section_view"
  | "section_dwell"
  | "click"
  | "interaction"
  | "conversion";

/** Landing-page sections, in scroll order. */
export type SectionName =
  | "hero"
  | "jung"
  | "founder"
  | "tarot"
  | "magazine"
  | "services_index"
  | "testimonials"
  | "lead_capture"
  | "blog"
  | "home_cta";

export type ConversionName =
  | "newsletter_signup"
  | "booking_click"
  | "booking_confirmed"
  | "manychat_open";

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

/** One client-emitted event before it is sent to /api/analytics. */
export interface AnalyticsEventInput {
  event_type: AnalyticsEventType;
  event_name?: string;
  path?: string;
  section?: string;
  dwell_ms?: number;
  props?: Record<string, unknown>;
  occurred_at: number; // epoch ms (client clock)
}

/** Capture-once attribution gathered on the first page of a session. */
export interface SessionAttribution {
  landing_path: string;
  referrer: string | null;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device: DeviceType;
  lang: string | null;
}

/** Request body POSTed to /api/analytics. */
export interface AnalyticsIngestBody {
  session_key: string;
  attribution?: SessionAttribution;
  events: AnalyticsEventInput[];
}

export interface AnalyticsSession extends SessionAttribution {
  id: string;
  session_key: string;
  started_at: string;
  country: string | null;
  is_bot: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  session_key: string;
  event_type: AnalyticsEventType;
  event_name: string | null;
  path: string | null;
  section: string | null;
  dwell_ms: number | null;
  props: Record<string, unknown>;
  occurred_at: string | null;
  created_at: string;
}

// Dashboard aggregate shapes (returned by the 010 RPCs)

export interface OverviewKpis {
  sessions: number;
  pageviews: number;
  avg_duration_ms: number;
  median_duration_ms: number;
  bounce_rate: number;
}

export interface SectionDwellRow {
  section: string;
  views: number;
  avg_dwell_ms: number;
  total_dwell_ms: number;
}

export interface TopClickRow {
  event_name: string;
  clicks: number;
}

export interface FunnelCounts {
  visit: number;
  engaged: number;
  cta_click: number;
  lead: number;
  booking: number;
}

/** A converted lead joined to its originating session for the dashboard. */
export interface SignupWithAttribution extends Lead {
  session?: Pick<
    AnalyticsSession,
    "referrer_host" | "utm_source" | "utm_medium" | "country" | "device"
  > | null;
  sections_seen?: string[];
}
