-- PATCH: Add missing user order policies
-- Run this if you already ran MIGRATION_COMPREHENSIVE_FIX.sql

-- Add user order policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Users can view their own orders'
  ) THEN
    CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Users can create their own orders'
  ) THEN
    CREATE POLICY "Users can create their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
