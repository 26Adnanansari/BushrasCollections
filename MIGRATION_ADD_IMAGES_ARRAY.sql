-- Add images array column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing rows to populate images from image_url if images is empty
UPDATE public.products
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (images IS NULL OR array_length(images, 1) IS NULL);
