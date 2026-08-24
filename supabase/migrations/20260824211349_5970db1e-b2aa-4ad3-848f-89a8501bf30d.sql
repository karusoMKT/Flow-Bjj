ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;