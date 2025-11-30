-- Add is_published column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.products.is_published IS 'Controls whether product is visible to public (unpublished products only visible to admins)';

-- Update existing products to be published by default
UPDATE public.products SET is_published = true WHERE is_published IS NULL;