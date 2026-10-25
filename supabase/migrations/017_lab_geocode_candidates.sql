-- 017: the geocode cache now stores the candidate list, not one result.
-- Run after 016. Until it runs, lookups still work; they just aren't cached.
ALTER TABLE lab_geocode_cache ADD COLUMN IF NOT EXISTS candidates jsonb;
