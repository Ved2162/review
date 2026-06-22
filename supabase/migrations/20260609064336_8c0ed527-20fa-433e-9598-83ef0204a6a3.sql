ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS custom_business_type text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid_words text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_tone text NOT NULL DEFAULT 'friendly';