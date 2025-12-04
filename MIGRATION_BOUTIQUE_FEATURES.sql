-- ============================================
-- MIGRATION: BOUTIQUE FEATURES
-- Run this script in your Supabase SQL Editor to update an EXISTING database
-- ============================================

-- 1. Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fabric_type TEXT,
ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS occasion_type TEXT,
ADD COLUMN IF NOT EXISTS embellishment TEXT;

-- 2. Create SKU generation function
CREATE OR REPLACE FUNCTION public.generate_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := CONCAT(
      'SKU-',
      UPPER(SUBSTRING(COALESCE(NEW.category, 'GEN'), 1, 2)),
      '-',
      LPAD(CAST(FLOOR(RANDOM() * 99999) AS TEXT), 5, '0')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Create trigger for SKU generation
DROP TRIGGER IF EXISTS generate_product_sku ON public.products;
CREATE TRIGGER generate_product_sku
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sku();

-- 4. Create index for SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
