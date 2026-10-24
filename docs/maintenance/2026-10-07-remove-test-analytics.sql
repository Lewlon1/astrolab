-- One-off cleanup of test/internal analytics rows. NOT a migration: do not place in supabase/migrations.
-- Run MANUALLY in the Supabase SQL editor for project "Astro lab" (nekpalyvjeaskdchrgih).
-- Prepared 2026-10-07 from read-only queries. Nothing here has been executed.
--
-- Scope (owner's instruction):
--   (a) every non-bot session that started on 4-5 Oct 2026, Madrid time
--       (2026-10-03 22:00Z .. 2026-10-05 22:00Z)  -> 18 sessions
--   (b) sessions linked to a booking shown in the admin Bookings page. bookings has NO
--       session_key, so the link is by timestamp: a booking_confirmed event within 10 s of a
--       bookings.created_at. Only one session is not already in (a):
--       26f8e3bd... (6 Oct 18:25, matches booking e19febab at 18:25:13).
--   Total: 19 sessions, 497 events. No leads rows reference these sessions.
--   NOTE (a) also removes any REAL visitors who happened to arrive on 4-5 Oct (8 had referrers,
--   e.g. l.instagram.com). That is what was asked for.
--   NOT linkable: bookings 6 Oct 17:54:26 and 17:57:56 had no booking_confirmed event.
--
-- STEP 0 (recommended): in the SQL editor, run the PREVIEW below and use "Download CSV"
-- for the events rows as a backup (deletes are irreversible).

-- PREVIEW (expect 19 sessions / 497 events)
select count(distinct s.session_key) as sessions, count(e.id) as events
from analytics_sessions s
left join analytics_events e on e.session_key = s.session_key
where s.session_key in (
  '7713ee2b-bbb2-4931-b756-4f96afb0a313','bcc2e9ac-6e47-4bef-bf57-10aee7bed413',
  '10b9a1f3-538a-4f42-8106-fb33c05eaf79','30cde75f-9304-4ba6-a7d0-8f842dd553e0',
  'bb9dfdeb-0b32-4bd2-a875-aaf86b25cf74','7d02a586-d3de-4a23-b103-cf36697e0b9f',
  '37046450-69b4-4fb6-b80a-d568805800d5','7db77c08-1e74-460d-9d6b-795df7db0892',
  'aeaee0ce-f492-477b-8812-f6c0407d778a','fbffbf33-1bb0-4e5b-a327-cb8d4efda44b',
  'f5ed9a88-c280-4ffc-89c7-b9f590a2f83c','6645dc45-7212-46fb-bd84-ab924d3c5375',
  '2d5e0536-b5c5-4ec1-8dbe-15e36eafa278','b33ad944-1e46-4926-9961-e864adfde7fc',
  'b120f6c3-46b3-4be7-ab24-5106c4984648','07c00ee7-aacb-45bb-b770-cb40189f232e',
  '678ab704-edad-4229-96d3-dd1473f801cb','326be075-7cfb-4c91-986e-c203de1116d5',
  '26f8e3bd-9e8c-4cfa-8582-54089d35f239'
);

-- DELETE (single atomic statement; run only after the preview matches 19 / 497)
with keys(k) as (values
  ('7713ee2b-bbb2-4931-b756-4f96afb0a313'),('bcc2e9ac-6e47-4bef-bf57-10aee7bed413'),
  ('10b9a1f3-538a-4f42-8106-fb33c05eaf79'),('30cde75f-9304-4ba6-a7d0-8f842dd553e0'),
  ('bb9dfdeb-0b32-4bd2-a875-aaf86b25cf74'),('7d02a586-d3de-4a23-b103-cf36697e0b9f'),
  ('37046450-69b4-4fb6-b80a-d568805800d5'),('7db77c08-1e74-460d-9d6b-795df7db0892'),
  ('aeaee0ce-f492-477b-8812-f6c0407d778a'),('fbffbf33-1bb0-4e5b-a327-cb8d4efda44b'),
  ('f5ed9a88-c280-4ffc-89c7-b9f590a2f83c'),('6645dc45-7212-46fb-bd84-ab924d3c5375'),
  ('2d5e0536-b5c5-4ec1-8dbe-15e36eafa278'),('b33ad944-1e46-4926-9961-e864adfde7fc'),
  ('b120f6c3-46b3-4be7-ab24-5106c4984648'),('07c00ee7-aacb-45bb-b770-cb40189f232e'),
  ('678ab704-edad-4229-96d3-dd1473f801cb'),('326be075-7cfb-4c91-986e-c203de1116d5'),
  ('26f8e3bd-9e8c-4cfa-8582-54089d35f239')
), ev as (
  delete from analytics_events where session_key in (select k from keys) returning 1
), se as (
  delete from analytics_sessions where session_key in (select k from keys) returning 1
)
select (select count(*) from se) as sessions_deleted, (select count(*) from ev) as events_deleted;
