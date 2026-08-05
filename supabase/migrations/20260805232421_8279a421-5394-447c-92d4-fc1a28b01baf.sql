ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

UPDATE public.profiles SET xp = GREATEST(total_xp, 0) WHERE xp = 0 AND total_xp > 0;
UPDATE public.profiles SET level = GREATEST(floor(0.1 * sqrt(xp))::int + 1, 1);