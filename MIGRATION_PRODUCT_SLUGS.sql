-- Add slug field to products table for SEO-friendly URLs
-- This migration adds a slug column and generates slugs from product names

-- Step 1: Add slug column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Function to generate slug from product name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT, id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert name to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Append short ID for uniqueness
  final_slug := base_slug || '-' || substring(id::text from 1 for 8);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate slugs for existing products
UPDATE public.products
SET slug = generate_slug(name, id)
WHERE slug IS NULL OR slug = '';

-- Step 4: Make slug unique and not null
ALTER TABLE public.products
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Step 5: Function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Trigger to auto-generate slug
DROP TRIGGER IF EXISTS products_set_slug ON public.products;
CREATE TRIGGER products_set_slug
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION set_product_slug();

-- Add comment
COMMENT ON COLUMN public.products.slug IS 'SEO-friendly URL slug generated from product name';
