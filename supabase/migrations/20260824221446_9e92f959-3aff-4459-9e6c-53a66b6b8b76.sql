CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_status_check CHECK (status IN ('pending','accepted')),
  CONSTRAINT connections_no_self CHECK (requester_id <> receiver_id),
  CONSTRAINT connections_unique_pair UNIQUE (requester_id, receiver_id)
);

CREATE INDEX connections_requester_idx ON public.connections(requester_id);
CREATE INDEX connections_receiver_idx ON public.connections(receiver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de conexões por autenticados"
  ON public.connections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário envia convite"
  ON public.connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Recebedor aceita convite"
  ON public.connections FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND status = 'accepted');

CREATE POLICY "Participantes desfazem conexão"
  ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.are_connected(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((requester_id = _a AND receiver_id = _b) OR (requester_id = _b AND receiver_id = _a))
  )
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;