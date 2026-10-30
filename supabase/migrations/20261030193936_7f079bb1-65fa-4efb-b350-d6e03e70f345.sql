CREATE TABLE public.study_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  attention_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_plans_status_chk CHECK (status IN ('active','paused','completed')),
  CONSTRAINT study_plans_goal_len CHECK (length(goal) BETWEEN 1 AND 300),
  CONSTRAINT study_plans_title_len CHECK (length(title) BETWEEN 1 AND 120)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own plans select" ON public.study_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own plans insert" ON public.study_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own plans update" ON public.study_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own plans delete" ON public.study_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX study_plans_user_idx ON public.study_plans(user_id);

CREATE TABLE public.study_plan_weeks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  title text NOT NULL,
  focus text,
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, week_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_weeks TO authenticated;
GRANT ALL ON public.study_plan_weeks TO service_role;
ALTER TABLE public.study_plan_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own weeks select" ON public.study_plan_weeks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own weeks insert" ON public.study_plan_weeks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.study_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));
CREATE POLICY "Own weeks update" ON public.study_plan_weeks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own weeks delete" ON public.study_plan_weeks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER study_plan_weeks_updated_at BEFORE UPDATE ON public.study_plan_weeks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX study_plan_weeks_plan_idx ON public.study_plan_weeks(plan_id);

CREATE TABLE public.training_reflections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL,
  position_worked text,
  main_difficulty text,
  highlight text,
  ai_summary text,
  next_focus text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_reflections TO authenticated;
GRANT ALL ON public.training_reflections TO service_role;
ALTER TABLE public.training_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reflections select" ON public.training_reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own reflections insert" ON public.training_reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reflections update" ON public.training_reflections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reflections delete" ON public.training_reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX training_reflections_user_idx ON public.training_reflections(user_id, created_at DESC);