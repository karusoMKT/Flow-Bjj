ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_competitor boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, city, team, professor, belt, is_competitor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'team',
    NEW.raw_user_meta_data ->> 'professor',
    COALESCE(NEW.raw_user_meta_data ->> 'belt', 'Branca'),
    COALESCE((NEW.raw_user_meta_data ->> 'is_competitor')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;