-- Create storage buckets for product images and hero media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('hero-media', 'hero-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND is_admin(auth.uid()));

-- RLS policies for hero-media bucket
CREATE POLICY "Anyone can view hero media"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-media');

CREATE POLICY "Admins can upload hero media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update hero media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero media"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-media' AND is_admin(auth.uid()));

-- Add sample products with placeholder images
INSERT INTO products (name, description, price, category, stock, is_featured, image_url)
VALUES
  ('Elegant Summer Dress', 'Beautiful floral print dress perfect for summer occasions', 89.99, 'Dresses', 15, true, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'),
  ('Classic Denim Jacket', 'Timeless denim jacket that goes with everything', 129.99, 'Outerwear', 20, true, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'),
  ('Silk Blouse', 'Luxurious silk blouse for office or evening wear', 79.99, 'Tops', 12, true, 'https://images.unsplash.com/photo-1564257577871-9eb2d501b22f?w=800'),
  ('Wide Leg Trousers', 'Comfortable and stylish wide leg trousers', 99.99, 'Bottoms', 18, false, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800'),
  ('Leather Handbag', 'Premium leather handbag with multiple compartments', 199.99, 'Accessories', 8, true, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'),
  ('Statement Necklace', 'Eye-catching statement necklace for special occasions', 49.99, 'Accessories', 25, false, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800');

-- Add sample hero slides
INSERT INTO hero_slides (title, subtitle, image_url, cta_text, cta_link, order_index, is_active)
VALUES
  ('New Spring Collection', 'Discover the latest trends in fashion', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920', 'Shop Now', '/products', 1, true),
  ('Summer Sale', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920', 'View Deals', '/products', 2, true);