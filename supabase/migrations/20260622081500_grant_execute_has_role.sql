-- Grant execute permissions on public.has_role to authenticated role
-- This is required so RLS policies using public.has_role can be evaluated during authenticated queries (e.g. staff creation, adding products, etc.).
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
