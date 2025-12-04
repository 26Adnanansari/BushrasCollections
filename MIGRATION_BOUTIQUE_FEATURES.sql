-- ============================================
-- MIGRATION: BOUTIQUE FEATURES
-- Run this script in your Supabase SQL Editor to update an EXISTING database
-- ============================================

-- 1. First, check if we need to rename 'stock' to 'stock_quantity'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN stock TO stock_quantity;
  END IF;
END $$;

-- 2. Add new columns to products table (if they don't exist)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fabric_type TEXT,
ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS occasion_type TEXT,
ADD COLUMN IF NOT EXISTS embellishment TEXT;

-- 3. Create SKU generation function
DROP FUNCTION IF EXISTS public.generate_sku() CASCADE;
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

-- 4. Create trigger for SKU generation
DROP TRIGGER IF EXISTS generate_product_sku ON public.products;
CREATE TRIGGER generate_product_sku
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sku();

-- 5. Create index for SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
