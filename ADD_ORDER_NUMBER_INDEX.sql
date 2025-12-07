-- ============================================
-- ADD INDEX ON ORDER_NUMBER FOR PERFORMANCE
-- ============================================
-- This allows fast lookups when using BC-00001 in URLs

CREATE INDEX IF NOT EXISTS idx_orders_order_number 
ON public.orders(order_number);

-- Verify index was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders' 
AND indexname = 'idx_orders_order_number';
