DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place a valid pending order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  order_number IS NOT NULL
  AND length(trim(order_number)) BETWEEN 6 AND 80
  AND customer_name IS NOT NULL
  AND length(trim(customer_name)) BETWEEN 2 AND 80
  AND email IS NOT NULL
  AND length(trim(email)) BETWEEN 3 AND 255
  AND email LIKE '%@%'
  AND phone IS NOT NULL
  AND length(trim(phone)) BETWEEN 6 AND 20
  AND address IS NOT NULL
  AND length(trim(address)) BETWEEN 5 AND 255
  AND city IS NOT NULL
  AND length(trim(city)) BETWEEN 2 AND 80
  AND (postal_code IS NULL OR length(trim(postal_code)) <= 20)
  AND (notes IS NULL OR length(trim(notes)) <= 500)
  AND total >= 0
  AND status = 'Pending'::public.order_status
);

DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
CREATE POLICY "Anyone can add valid order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  order_id IS NOT NULL
  AND device_name IS NOT NULL
  AND length(trim(device_name)) BETWEEN 1 AND 255
  AND unit_price >= 0
  AND quantity > 0
);

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit complete contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND length(trim(name)) BETWEEN 2 AND 120
  AND email IS NOT NULL
  AND length(trim(email)) BETWEEN 3 AND 255
  AND email LIKE '%@%'
  AND subject IS NOT NULL
  AND length(trim(subject)) BETWEEN 2 AND 160
  AND message IS NOT NULL
  AND length(trim(message)) BETWEEN 10 AND 2000
);

REVOKE EXECUTE ON FUNCTION public.assign_staff_role_by_admin(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) FROM anon;