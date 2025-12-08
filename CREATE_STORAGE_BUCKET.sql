-- ============================================
-- CREATE STORAGE BUCKET FOR PAYMENT PROOFS
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents', 
  'order-documents', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS
-- (Buckets usually inherit RLS from storage.objects, but good to be explicit if needed, 
-- though standard Supabase storage setup relies on storage.objects policies)

-- 3. Create RLS Policies for storage.objects

-- Allow public access to view files (so admins can see them easily)
CREATE POLICY "Anyone can view order documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-documents');

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload order documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Allow authenticated users (admins) to update files
CREATE POLICY "Authenticated users can update order documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Allow authenticated users (admins) to delete files
CREATE POLICY "Authenticated users can delete order documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');
