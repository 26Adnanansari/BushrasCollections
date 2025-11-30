-- Add list_price column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS list_price numeric;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for CSV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-csv', 'product-csv', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product images bucket (public read, admin write)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND public.is_admin()
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND public.is_admin()
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND public.is_admin()
);

-- RLS policies for CSV bucket (admin only)
CREATE POLICY "Admins can manage CSV files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-csv' 
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'product-csv' 
  AND public.is_admin()
);