-- Drop ALL existing storage policies for these buckets to start fresh
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload hero media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update hero media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update hero media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete hero media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view hero media" ON storage.objects;

-- Recreate with proper admin restrictions
-- Product Images: Admin-only upload/update/delete
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- Hero Media: Admin-only upload/update/delete
CREATE POLICY "Admins can upload hero media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hero-media' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update hero media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hero-media' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'hero-media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hero-media' AND public.is_admin(auth.uid()));

-- Keep public read access for both buckets
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can view hero media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hero-media');