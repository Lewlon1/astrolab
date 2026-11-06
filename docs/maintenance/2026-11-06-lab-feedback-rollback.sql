-- ============================================================================
-- ROLLBACK for 018_lab_reading_feedback.sql (reading thumbs + signal views).
-- Run MANUALLY in the Supabase SQL Editor. NOT applied by any tool.
-- Every statement is commented out on purpose (step 2 deletes data). Uncomment
-- one step at a time, read it, then run it.
--
-- State when this was written (2026-11-06): 018 has NOT been applied anywhere.
-- Nothing else depends on it except app/api/lab/feedback, the drawId link in
-- app/api/lab/gate (a failure there is logged and never blocks signup) and
-- app/admin/lab-signal. Ship the code revert first, or those log errors.
-- ============================================================================

-- BEGIN;

-- 1. Views (no data)
-- DROP VIEW IF EXISTS lab_reading_signal_summary;
-- DROP VIEW IF EXISTS lab_reading_signal;

-- 2. Votes. EXPORT FIRST if the data matters: SELECT * FROM lab_reading_feedback;
-- DROP TABLE IF EXISTS lab_reading_feedback;

-- 3. Booking email index (harmless to keep)
-- DROP INDEX IF EXISTS idx_bookings_attendee_email_lower;

-- COMMIT;
