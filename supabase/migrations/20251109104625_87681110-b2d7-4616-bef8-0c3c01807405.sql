-- Fix schema mismatch: Rename columns to match code expectations
-- This fixes the 400 Bad Request errors caused by querying non-existent columns

-- 1. Rename hero_slides.active to is_active
ALTER TABLE hero_slides RENAME COLUMN active TO is_active;

-- 2. Rename products.featured to is_featured  
ALTER TABLE products RENAME COLUMN featured TO is_featured;

-- 3. Update RLS policies that reference the old column names
-- Drop and recreate the policy for hero_slides
DROP POLICY IF EXISTS "Anyone can view active hero slides" ON hero_slides;
CREATE POLICY "Anyone can view active hero slides" 
ON hero_slides 
FOR SELECT 
USING (is_active = true);

-- Note: Products policies use 'true' for public access, so no changes needed there
-- The admin policies use is_admin() function which doesn't reference these columns