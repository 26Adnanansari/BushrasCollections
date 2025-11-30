-- Update existing products with correct image paths
UPDATE public.products 
SET images = '["product-1.jpg"]'
WHERE name = 'Elegant Beige Collection';

UPDATE public.products 
SET images = '["product-2.jpg"]'
WHERE name = 'Flowing Cream Ensemble';

UPDATE public.products 
SET images = '["product-3.jpg"]'
WHERE name = 'Terracotta Heritage';

-- Add more sample products for better showcase
INSERT INTO public.products (name, description, price, category, stock_quantity, images) VALUES
('Midnight Blue Elegance', 'Sophisticated midnight blue ensemble with silver embellishments', 11200.00, 'Formal', 6, '[]'),
('Coral Sunset Collection', 'Vibrant coral outfit perfect for evening occasions', 8900.00, 'Evening', 8, '[]'),
('Ivory Dream Attire', 'Pure ivory collection with delicate lacework and pearls', 13500.00, 'Bridal', 2, '[]'),
('Forest Green Heritage', 'Rich forest green with traditional gold threadwork', 7800.00, 'Traditional', 10, '[]'),
('Blush Pink Romance', 'Soft blush pink with romantic floral embroidery', 6200.00, 'Casual', 14, '[]');

-- Update product search path function
CREATE OR REPLACE FUNCTION public.search_products(search_term text)
RETURNS TABLE (
  id uuid,
  name varchar,
  description text,
  price numeric,
  category varchar,
  brand varchar,
  stock_quantity integer,
  images jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.description, p.price, p.category, p.brand, 
         p.stock_quantity, p.images, p.is_active, p.created_at, p.updated_at
  FROM public.products p
  WHERE p.is_active = true 
    AND (
      p.name ILIKE '%' || search_term || '%' 
      OR p.description ILIKE '%' || search_term || '%'
      OR p.category ILIKE '%' || search_term || '%'
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;