-- Scout Connect - onboarding profile fields
-- Safe to run after 001_initial_schema.sql on existing projects.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS unit_id UUID,
  ADD COLUMN IF NOT EXISTS clan_id UUID,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS scout_rank TEXT,
  ADD COLUMN IF NOT EXISTS has_wood_badge BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wood_badge_beads INTEGER,
  ADD COLUMN IF NOT EXISTS wood_badge_status TEXT;

ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS unit_name TEXT,
  ADD COLUMN IF NOT EXISTS clan_name TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_org_leader BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wood_badge_beads INTEGER DEFAULT 0;
