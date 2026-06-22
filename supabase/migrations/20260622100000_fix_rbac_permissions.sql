-- Consolidated RBAC permissions fix
-- Fixes: has_role execute, table grants, customer/staff order RLS, audit_log, device-images storage

-- 1. has_role execute (required for RLS policy evaluation)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- 2. user_roles write grants (staff creation by admin via RLS)
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 3. companies admin writes
GRANT INSERT, UPDATE, DELETE ON public.companies TO authenticated;

-- 4. Customer order policies
CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Customers view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

-- 5. Staff order policies
CREATE POLICY "Staff view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- 6. Audit log RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.audit_log TO authenticated;

CREATE POLICY "Admins view audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Device images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'device-images',
  'device-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read device images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'device-images');

CREATE POLICY "Admins upload device images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'device-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins update device images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'device-images'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete device images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'device-images'
    AND public.has_role(auth.uid(), 'admin')
  );
