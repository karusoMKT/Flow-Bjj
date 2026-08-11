CREATE TABLE public.custom_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_locations TO authenticated;
GRANT ALL ON public.custom_locations TO service_role;

ALTER TABLE public.custom_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de locais" ON public.custom_locations FOR SELECT USING (true);
CREATE POLICY "Usuário cria local" ON public.custom_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Usuário edita próprio local" ON public.custom_locations FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Usuário apaga próprio local" ON public.custom_locations FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX custom_locations_name_idx ON public.custom_locations (lower(name));

CREATE TRIGGER update_custom_locations_updated_at BEFORE UPDATE ON public.custom_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();