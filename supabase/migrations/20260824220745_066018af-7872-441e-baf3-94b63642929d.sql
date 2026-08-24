ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;

DROP POLICY IF EXISTS "Usuário deixa de seguir" ON public.follows;
CREATE POLICY "Usuário deixa de seguir"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Usuário atualiza status da conexão" ON public.follows;
CREATE POLICY "Usuário atualiza status da conexão"
  ON public.follows FOR UPDATE TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id)
  WITH CHECK (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows (following_id);