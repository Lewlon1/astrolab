-- Seed engagement accounts with 10 starter accounts
INSERT INTO engagement_accounts (id, handle, platform, followers, niche, why_engage, is_active)
VALUES
  (gen_random_uuid(), '@concienciainquieta', 'instagram', '12.4K', 'Collaboration', 'Collab partner — aligned audience and values', true),
  (gen_random_uuid(), '@astro.bcn', 'instagram', '3.2K', 'Astrology', 'Local astrology community in Barcelona', true),
  (gen_random_uuid(), '@holisticabcn', 'instagram', '8.1K', 'Wellness', 'Wellness crossover — holistic health audience', true),
  (gen_random_uuid(), '@eteria.circle', 'instagram', '1.8K', 'Community', 'Spanish-speaking spiritual community', true),
  (gen_random_uuid(), '@lunaysolbcn', 'instagram', '5.6K', 'Spirituality', 'Spiritual niche Barcelona — aligned audience', true),
  (gen_random_uuid(), '@tarotbarcelona', 'instagram', '4.1K', 'Divination', 'Divination crossover — tarot community', true),
  (gen_random_uuid(), '@yogashala.bcn', 'instagram', '9.3K', 'Wellness', 'Wellness/yoga community in Barcelona', true),
  (gen_random_uuid(), '@bcn.conscious', 'instagram', '2.7K', 'Lifestyle', 'Conscious living community', true),
  (gen_random_uuid(), '@astrologiapractica', 'instagram', '7.2K', 'Astrology', 'Spanish astrology education', true),
  (gen_random_uuid(), '@mindfulbcn', 'instagram', '3.8K', 'Mindfulness', 'Mindfulness community in Barcelona', true);
