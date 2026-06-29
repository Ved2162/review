CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 120),
  google_review_url TEXT NOT NULL CHECK (google_review_url ~ '^https?://'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scans INTEGER NOT NULL DEFAULT 0 CHECK (scans >= 0),
  reviews_generated INTEGER NOT NULL DEFAULT 0 CHECK (reviews_generated >= 0),
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  custom_business_type TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  avoid_words TEXT[] NOT NULL DEFAULT '{}',
  brand_tone TEXT NOT NULL DEFAULT 'friendly',
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS custom_business_type TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid_words TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_tone TEXT NOT NULL DEFAULT 'friendly',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "QR visitors can read restaurants" ON public.restaurants;

CREATE POLICY "QR visitors can read restaurants"
ON public.restaurants
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.increment_restaurant_scans(_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurants
  SET scans = scans + 1
  WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_restaurant_reviews(_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurants
  SET reviews_generated = reviews_generated + 1
  WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_restaurant_scans(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_restaurant_reviews(TEXT) TO anon, authenticated;
