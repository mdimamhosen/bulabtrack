-- Fix: permission denied for function has_role
-- Run this in Supabase Dashboard → SQL Editor if staff/device admin actions fail.

-- Required: authenticated role must EXECUTE has_role so RLS policies can evaluate it
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Required: admin RLS policies on user_roles need table-level write grants
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Recommended: other admin writes blocked at table level
GRANT INSERT, UPDATE, DELETE ON public.companies TO authenticated;

-- Staff role assignment without relying on client-side RLS (works even before grants propagate)
CREATE OR REPLACE FUNCTION public.assign_staff_role_by_admin(
  target_user_id UUID,
  staff_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create staff accounts.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign staff role to your own account.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User profile not found. Complete sign-up first.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET
    needs_password_change = true,
    name = COALESCE(NULLIF(trim(staff_name), ''), name)
  WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_staff_role_by_admin(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_staff_role_by_admin(UUID, TEXT) TO authenticated;
