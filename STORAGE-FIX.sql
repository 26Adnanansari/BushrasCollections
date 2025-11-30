-- =====================================================
-- STORAGE BUCKETS POLICY FIX
-- Run this in Supabase SQL Editor to fix image upload issues
-- =====================================================

-- This fixes the "Failed to upload image" error by replacing
-- complex admin check policies with simple authenticated user policies

-- Drop all existing conflicting storage policies
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete product images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete hero media" ON storage.objects;
DROP POLICY IF EXISTS "Public read hero media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload hero media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update hero media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete hero media" ON storage.objects;

-- Ensure storage buckets exist and are public (for viewing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-media', 'hero-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==========================================
-- PRODUCT IMAGES BUCKET POLICIES
-- ==========================================

-- Anyone can view product images (bucket is public)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Any authenticated user can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Any authenticated user can update product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Any authenticated user can delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- ==========================================
-- HERO MEDIA BUCKET POLICIES
-- ==========================================

-- Anyone can view hero media (bucket is public)
CREATE POLICY "Public can view hero media"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-media');

-- Any authenticated user can upload hero media
CREATE POLICY "Authenticated users can upload hero media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-media' 
  AND auth.role() = 'authenticated'
);

-- Any authenticated user can update hero media
CREATE POLICY "Authenticated users can update hero media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-media' 
  AND auth.role() = 'authenticated'
);

-- Any authenticated user can delete hero media
CREATE POLICY "Authenticated users can delete hero media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-media' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Check that buckets are public
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('product-images', 'hero-media');

-- =====================================================
-- COMPLETED SUCCESSFULLY
-- Image uploads should now work!
-- =====================================================
