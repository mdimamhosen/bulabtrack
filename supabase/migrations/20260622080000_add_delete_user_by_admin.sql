-- Create delete_user_by_admin function to allow admins to delete user accounts securely
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete user accounts.';
  END IF;

  -- Ensure admins cannot delete themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot delete their own accounts.';
  END IF;

  -- Delete the user from auth.users (cascades to profiles and user_roles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Revoke execute from public and anon roles
REVOKE EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) FROM public, anon;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;
