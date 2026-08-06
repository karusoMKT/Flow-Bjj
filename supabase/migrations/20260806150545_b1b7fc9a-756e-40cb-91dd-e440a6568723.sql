ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS link text;