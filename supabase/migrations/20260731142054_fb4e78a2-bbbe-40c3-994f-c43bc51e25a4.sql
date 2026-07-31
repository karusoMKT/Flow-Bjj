CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  icon_name text NOT NULL DEFAULT 'Trophy',
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title)
);

GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias conquistas" ON public.user_achievements
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria próprias conquistas" ON public.user_achievements
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);