-- AI journal titles, mood tags, and monthly recap support.

ALTER TABLE sky_moments
  ADD COLUMN IF NOT EXISTS title varchar(80),
  ADD COLUMN IF NOT EXISTS mood_tags jsonb;

