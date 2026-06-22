-- Add needs_password_change column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN NOT NULL DEFAULT false;

-- Update handle_new_user trigger function to register users as customers (no role) by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, needs_password_change)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'needs_password_change')::boolean, false)
  );

  -- First user becomes admin
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END; $$;
