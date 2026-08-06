DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('student','instructor','gym');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'student';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'checkin',
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS event_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS event_location text;