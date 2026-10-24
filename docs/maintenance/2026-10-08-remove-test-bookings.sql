-- Remove test bookings from production `bookings` (owner-confirmed tests, 2026-10-08)
--
-- Prepared by Claude, NOT run by Claude. Owner runs it in the Supabase SQL editor
-- (project "Astro lab", nekpalyvjeaskdchrgih).
--
-- Before running:
--   1. In Cal.com, cancel/decline the two FUTURE test bookings (23 Oct and 28 Oct)
--      so the slots free up. Deleting DB rows does not touch Cal.com.
--      If Cal sends a cancellation webhook after the rows are gone, nothing breaks.
--   2. None of these have a stripe_session_id / payment, so nothing to refund.
--
-- No other tables reference `bookings` (no foreign keys), so this deletes nothing else.
--
-- The 6 rows (all payment_status = 'unpaid'):
--   e673c9dc-cf53-4e7c-b83e-f8744b27d13b  astro-psyche-blend          6 Oct   accepted  parrillagabriela22@
--   c24a75a9-7ac2-468b-9fb2-e57d44c893d0  astro-psyche-blend          7 Oct   accepted  parrillagabriela22@
--   87c61245-eab7-489a-898b-fe40d0d2b75a  stellar-insights            8 Oct   pending   lonsdale744@
--   ee00d720-7c6f-44e3-9bae-fce1872b08d4  solar-return-retorno-solar  7 Oct   pending   astropsychelabadmi@
--   91693813-eaeb-487e-a5cc-4f6f51c317fe  stellar-insights           23 Oct   pending   astropsychelabadmi@
--   e19febab-0b17-468d-92f3-70bb0dce1427  astro-psyche-blend         28 Oct   pending   astropsychelabadmi@

-- STEP 1 — preview. Expect: 6 rows, total_bookings 6.
SELECT id, service_slug, attendee_email, start_time, cal_status, payment_status,
       (SELECT count(*) FROM bookings) AS total_bookings
FROM bookings
WHERE id IN (
  'e673c9dc-cf53-4e7c-b83e-f8744b27d13b',
  'c24a75a9-7ac2-468b-9fb2-e57d44c893d0',
  '87c61245-eab7-489a-898b-fe40d0d2b75a',
  'ee00d720-7c6f-44e3-9bae-fce1872b08d4',
  '91693813-eaeb-487e-a5cc-4f6f51c317fe',
  'e19febab-0b17-468d-92f3-70bb0dce1427'
)
ORDER BY created_at;

-- STEP 2 — delete. Only by id, and only if still unpaid (a real payment would protect the row).
-- Expect: DELETE 6. If the number differs, investigate before doing anything else.
DELETE FROM bookings
WHERE id IN (
  'e673c9dc-cf53-4e7c-b83e-f8744b27d13b',
  'c24a75a9-7ac2-468b-9fb2-e57d44c893d0',
  '87c61245-eab7-489a-898b-fe40d0d2b75a',
  'ee00d720-7c6f-44e3-9bae-fce1872b08d4',
  '91693813-eaeb-487e-a5cc-4f6f51c317fe',
  'e19febab-0b17-468d-92f3-70bb0dce1427'
)
AND payment_status = 'unpaid'
AND stripe_session_id IS NULL;

-- STEP 3 — verify. Expect: 0.
SELECT count(*) AS remaining_bookings FROM bookings;
