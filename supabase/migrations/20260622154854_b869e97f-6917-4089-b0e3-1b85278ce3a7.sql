GRANT INSERT, SELECT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT INSERT, SELECT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;