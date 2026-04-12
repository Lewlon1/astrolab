-- Seed example events
INSERT INTO events (title, slug, event_type, description, date, location, price, price_label, capacity, eventbrite_url, is_published)
VALUES
  (
    'Decode Your Birth Chart',
    'decode-your-birth-chart-may-2026',
    'workshop',
    'A hands-on workshop where you''ll learn to read the key placements in your own birth chart. Bring your birth time and prepare to see your patterns in a whole new light.',
    '2026-05-17 11:00:00+02',
    'Barcelona',
    35,
    '€35',
    20,
    NULL,
    true
  ),
  (
    'Cosmic Tasters — café edition',
    'cosmic-tasters-cafe-may-2026',
    'cosmic_tasters',
    'Drop in for a casual astrology tasting session over coffee. Get a quick snapshot of your Sun, Moon, and Rising — perfect if you''re astro-curious but not ready for a full reading.',
    '2026-05-22 18:00:00+02',
    'Barcelona',
    0,
    'Free entry (pay for drinks)',
    15,
    NULL,
    true
  );
