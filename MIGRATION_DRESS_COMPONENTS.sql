-- ============================================================
-- MIGRATION: Dress Components + Delivery Weeks
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Dress components per product
--    Structure: [{ "name": "Choli", "price": 95000 }, { "name": "Dupatta", "price": null }]
--    price = null means "WhatsApp Inquiry" will be shown
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dress_components JSONB DEFAULT '[]'::jsonb;

-- 2. Delivery weeks text (for Made to Order products only)
--    e.g., "8-9 Weeks", "4-5 Weeks"
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_weeks TEXT;

-- 3. Index for dress_components (GIN for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_products_dress_components
  ON public.products USING GIN (dress_components);

-- NOTE: Global size chart and WhatsApp number are stored in
-- the site_settings table (key-value), NOT per product.
-- They will be saved via the admin Site Settings page.

-- Verify columns added:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name IN ('dress_components', 'delivery_weeks');
