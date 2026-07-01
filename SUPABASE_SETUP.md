# Supabase Setup for ReviewGenie

If your Supabase project is missing the `public.restaurants` table, run this SQL in the Supabase SQL Editor.

This app expects the following schema and functions.

> Copy only the SQL below; do not include the surrounding Markdown fences like ````sql````.

```sql  
CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 120),
  google_review_url TEXT NOT NULL CHECK (google_review_url ~ '^https?://'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scans INTEGER NOT NULL DEFAULT 0 CHECK (scans >= 0),
  reviews_generated INTEGER NOT NULL DEFAULT 0 CHECK (reviews_generated >= 0)
);

GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "QR visitors can read restaurants"
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
```

## How to apply

1. Open your Supabase project.
2. Go to the `SQL Editor`.
3. Paste only the SQL contents from `SUPABASE_SETUP.sql` and run it.
4. Confirm the `public.restaurants` table exists in the table browser.

## Notes

- This file is intended for new Supabase projects or projects where the schema was not created yet.
- The app uses Supabase table and function names exactly as shown above.
- If you deploy in Vercel, make sure the project environment variables are also set to the correct Supabase project values.
