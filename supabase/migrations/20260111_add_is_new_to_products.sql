-- Add is_new column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true;

-- Update existing products to have is_new = true if they were created in the last 30 days
-- though setting all to true by default is also fine as requested.
UPDATE products SET is_new = true;
