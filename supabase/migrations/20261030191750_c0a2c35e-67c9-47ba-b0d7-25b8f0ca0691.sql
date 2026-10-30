CREATE TABLE public.ai_memories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own memories select" ON public.ai_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own memories insert" ON public.ai_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own memories update" ON public.ai_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own memories delete" ON public.ai_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.validate_ai_memory() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kind NOT IN ('goal','favorite_position','difficulty') THEN RAISE EXCEPTION 'invalid kind'; END IF;
  IF length(trim(NEW.content)) = 0 OR length(NEW.content) > 200 THEN RAISE EXCEPTION 'invalid content'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_ai_memory BEFORE INSERT OR UPDATE ON public.ai_memories FOR EACH ROW EXECUTE FUNCTION public.validate_ai_memory();
CREATE TRIGGER ai_memories_updated_at BEFORE UPDATE ON public.ai_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX ai_memories_user_idx ON public.ai_memories(user_id);