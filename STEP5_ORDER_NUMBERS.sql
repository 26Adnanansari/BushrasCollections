-- ============================================
-- PHASE 1: CUSTOM ORDER NUMBER SYSTEM
-- ============================================
-- Format: BC-00001, BC-00002, etc.
-- BC = Bushra's Collection

-- Step 1: Add order_number column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Step 2: Create sequence for auto-incrementing
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Step 3: Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Get next number from sequence
  next_num := nextval('order_number_seq');
  
  -- Format as BC-XXXXX (5 digits, zero-padded)
  order_num := 'BC-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$;

-- Step 4: Create trigger to auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Step 5: Update existing orders with order numbers
UPDATE orders
SET order_number = 'BC-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0')
WHERE order_number IS NULL;

-- Step 6: Reset sequence to continue from last number
SELECT setval('order_number_seq', (SELECT COUNT(*) FROM orders));

-- Step 7: Verify order numbers were created
SELECT 
  id,
  order_number,
  user_id,
  total,
  status,
  created_at
FROM orders
ORDER BY created_at DESC;

-- Expected result: All orders should have BC-XXXXX format
