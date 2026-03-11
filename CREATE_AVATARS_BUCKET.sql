-- =====================================================
-- CREATE AVATARS STORAGE BUCKET
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Error fix: StorageApiError: Bucket not found
-- =====================================================

-- 1. Create the avatars bucket (public so images are accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. RLS Policy: Anyone can VIEW avatars (public bucket)
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. RLS Policy: Logged-in users can UPLOAD their own avatar
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- 4. RLS Policy: Users can UPDATE their own avatar
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(storage.filename(name), '-', 1)
);

-- 5. RLS Policy: Users can DELETE their own avatar
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(storage.filename(name), '-', 1)
);

-- Done! The 'avatars' bucket now exists with proper policies.
