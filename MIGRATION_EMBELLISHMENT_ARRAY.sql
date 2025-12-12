-- Migration to change embellishment from TEXT to JSONB array
-- This allows products to have multiple embellishment types

-- Step 1: Add new column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS embellishments JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing data (convert single embellishment to array)
UPDATE public.products
SET embellishments = 
  CASE 
    WHEN embellishment IS NOT NULL AND embellishment != '' 
    THEN jsonb_build_array(embellishment)
    ELSE '[]'::jsonb
  END
WHERE embellishments = '[]'::jsonb OR embellishments IS NULL;

-- Step 3: Drop old column (optional - can keep for backward compatibility)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS embellishment;

-- Note: We're keeping both columns for now to maintain backward compatibility
-- Frontend will use 'embellishments' (array) going forward
-- Old 'embellishment' (text) column can be removed in future migration

COMMENT ON COLUMN public.products.embellishments IS 'Array of embellishment types (e.g., ["Embroidery", "Stone Work"])';
