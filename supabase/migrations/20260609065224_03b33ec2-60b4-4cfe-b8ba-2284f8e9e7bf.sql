DROP POLICY IF EXISTS "QR visitors can read restaurants" ON public.restaurants;
REVOKE SELECT ON public.restaurants FROM anon;