-- Fix orders trigger and RLS policies
-- File: supabase/migrations/20260624000000_fix_orders_rls_and_trigger.sql

-- 1. Fix public.orders_audit_trigger() function
-- Since public.orders does not have a created_by column, accessing new.created_by/old.created_by raises a runtime error.
-- We replace it with auth.uid() which logs the ID of the authenticated user making the request (or NULL if anonymous).
CREATE OR REPLACE FUNCTION public.orders_audit_trigger() RETURNS trigger AS $$
BEGIN
  IF (tg_op = 'INSERT') THEN
    PERFORM public.log_audit('order_created', auth.uid(), jsonb_build_object('order_id', new.id)::text);
    RETURN new;
  ELSIF (tg_op = 'UPDATE') THEN
    PERFORM public.log_audit('order_updated', auth.uid(), jsonb_build_object('order_id', new.id, 'changes', hstore(old) - hstore(new))::text);
    RETURN new;
  ELSIF (tg_op = 'DELETE') THEN
    PERFORM public.log_audit('order_deleted', auth.uid(), jsonb_build_object('order_id', old.id)::text);
    RETURN old;
  END IF;
  RETURN null;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop and Recreate orders RLS policies to make sure they are correct
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Staff view orders" ON public.orders;
CREATE POLICY "Staff view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::public.app_role));

DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'staff'::public.app_role));

DROP POLICY IF EXISTS "Admins view orders" ON public.orders;
CREATE POLICY "Admins view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Drop and Recreate order_items RLS policies
DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
CREATE POLICY "Anyone can add order items" ON public.order_items 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
CREATE POLICY "Customers view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Staff view order items" ON public.order_items;
CREATE POLICY "Staff view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'::public.app_role));

DROP POLICY IF EXISTS "Admins view order items" ON public.order_items;
CREATE POLICY "Admins view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins delete order items" ON public.order_items;
CREATE POLICY "Admins delete order items" ON public.order_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
