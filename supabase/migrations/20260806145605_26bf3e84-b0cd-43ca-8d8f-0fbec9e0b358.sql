ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_type;
DROP TYPE IF EXISTS public.account_type;

CREATE TABLE public.event_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.event_interests TO authenticated;
GRANT SELECT ON public.event_interests TO anon;
GRANT ALL ON public.event_interests TO service_role;

ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de interesses" ON public.event_interests FOR SELECT USING (true);
CREATE POLICY "Usuário marca interesse" ON public.event_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário remove próprio interesse" ON public.event_interests FOR DELETE TO authenticated USING (auth.uid() = user_id);