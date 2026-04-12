-- ============================================
-- Seed: Services
-- ============================================

INSERT INTO services (name, slug, price, price_label, duration, short_description, description, tag, sort_order) VALUES
(
  'Cosmic Quick Hit',
  'cosmic-quick-hit',
  25,
  '€25',
  '15 min',
  'A focused snapshot of one area — love, career, or personal growth.',
  'A focused snapshot of one area — love, career, or personal growth. Quick, sharp, and surprisingly deep.',
  'Entry',
  1
),
(
  'Stellar Insights',
  'stellar-insights',
  65,
  '€65',
  '45 min',
  'Full birth chart reading with psychological depth. Your patterns, your blind spots, your roadmap.',
  'Full birth chart reading with psychological depth. Your patterns, your blind spots, your roadmap. This is the session most people start with.',
  'Most popular',
  2
),
(
  'Star-Crossed',
  'star-crossed',
  95,
  '€95',
  '60 min',
  'Synastry reading for couples or any relationship. Decode the dynamic between two charts.',
  'Synastry reading for couples or any relationship. Decode the dynamic between two charts. Understand the friction, the magnetism, and the growth edge.',
  'Relationships',
  3
),
(
  'Cosmic Alliance',
  'cosmic-alliance',
  180,
  '€180',
  '90 min',
  'Deep chart integration + astrocartography. Your comprehensive life blueprint including best locations.',
  'Deep chart integration + astrocartography. Your comprehensive life blueprint including best locations. The full picture — where you thrive, how you grow, and where in the world supports it.',
  'Premium',
  4
),
(
  'Cosmic Check-In',
  'cosmic-check-in',
  45,
  '€45/mo',
  '30 min',
  'Monthly transit check-in. Stay aligned as the planets shift.',
  'Monthly transit check-in. Stay aligned as the planets shift. A recurring session to keep you grounded and intentional.',
  'Recurring',
  5
),
(
  'Love & Career Code',
  'love-and-career-code',
  0,
  'Free',
  '2 min voice note',
  'Your Venus, Saturn & Midheaven decoded. Comment LOVECODE on Instagram.',
  'Your Venus, Saturn & Midheaven decoded. A free voice note revealing your love language and career wiring. Comment LOVECODE on Instagram to claim yours.',
  'Lead magnet',
  6
);
