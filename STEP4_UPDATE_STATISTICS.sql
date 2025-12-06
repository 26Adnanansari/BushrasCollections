-- ============================================
-- STEP 4: Update Existing Customer Statistics
-- ============================================
-- Run this AFTER Step 3 succeeds
-- This will populate the statistics for existing orders

UPDATE profiles
SET 
  total_orders = (
    SELECT COUNT(*) 
    FROM orders 
    WHERE orders.user_id = profiles.id
  ),
  total_spent = (
    SELECT COALESCE(SUM(total), 0) 
    FROM orders 
    WHERE orders.user_id = profiles.id 
    AND status = 'delivered'
  ),
  last_order_date = (
    SELECT MAX(created_at) 
    FROM orders 
    WHERE orders.user_id = profiles.id
  ),
  customer_segment = CASE 
    WHEN (SELECT COUNT(*) FROM orders WHERE user_id = profiles.id AND status = 'delivered') >= 5 
      OR (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = profiles.id AND status = 'delivered') >= 50000 
      THEN 'vip'
    WHEN (SELECT COUNT(*) FROM orders WHERE user_id = profiles.id AND status = 'delivered') >= 2 
      THEN 'returning'
    WHEN (SELECT COUNT(*) FROM orders WHERE user_id = profiles.id) > 0
      THEN 'new'
    ELSE 'new'
  END
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- Verify the update
SELECT 
  name,
  email,
  total_orders,
  total_spent,
  last_order_date,
  customer_segment
FROM profiles
WHERE total_orders > 0;

-- This should show Salman and any other customers with orders!
