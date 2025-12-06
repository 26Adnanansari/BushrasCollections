-- ============================================
-- CHECK AND FIX: Orders Not Showing in Analytics
-- ============================================
-- This script will:
-- 1. Show all orders in the database
-- 2. Update profile statistics manually
-- 3. Fix the customer analytics data

-- Step 1: Check all orders
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.created_at,
  p.name as customer_name,
  p.email
FROM orders o
LEFT JOIN profiles p ON p.id = o.user_id
ORDER BY o.created_at DESC;

-- Step 2: Check profile statistics
SELECT 
  id,
  name,
  email,
  total_orders,
  total_spent,
  last_order_date
FROM profiles
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- Step 3: Manually update profile statistics
-- This will calculate and update the stats for all customers who have orders

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
  )
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- Step 4: Verify the update
SELECT 
  p.name,
  p.email,
  p.total_orders,
  p.total_spent,
  p.last_order_date,
  COUNT(o.id) as actual_order_count
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
GROUP BY p.id, p.name, p.email, p.total_orders, p.total_spent, p.last_order_date
HAVING COUNT(o.id) > 0;

-- ============================================
-- IMPORTANT: After running this, you should also run
-- MIGRATION_ORDER_MANAGEMENT.sql to set up automatic updates
-- ============================================
