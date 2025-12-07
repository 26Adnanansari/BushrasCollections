-- ============================================
-- PAYMENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================
-- Supports: Advance payments, COD, Bank transfers, Payment history

-- Step 1: Create order_payments table
CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'online', 'other'
  payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  
  -- Bank transfer details (optional)
  bank_name TEXT,
  account_holder TEXT,
  transaction_id TEXT,
  transaction_proof_url TEXT, -- Screenshot/proof stored in Supabase Storage
  
  -- Metadata
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id), -- Admin who recorded it
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add payment tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_created_at ON public.order_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_payments_payment_date ON public.order_payments(payment_date DESC);

-- Step 4: Enable RLS on order_payments
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for order_payments
-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.order_payments FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

-- Admins can insert payments
CREATE POLICY "Admins can insert payments"
  ON public.order_payments FOR INSERT
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- Admins can update payments
CREATE POLICY "Admins can update payments"
  ON public.order_payments FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())));

-- Admins can delete payments
CREATE POLICY "Admins can delete payments"
  ON public.order_payments FOR DELETE
  USING (public.is_admin((SELECT auth.uid())));

-- Step 6: Create function to calculate payment totals
CREATE OR REPLACE FUNCTION public.update_order_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate total_paid and balance_due for the order
  UPDATE public.orders
  SET 
    total_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    balance_due = total - (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    payment_status = CASE 
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) = 0 THEN 'pending_payment'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) < total THEN 'partial_payment'
      ELSE 'paid'
    END
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 7: Create trigger to auto-update payment totals
DROP TRIGGER IF EXISTS update_payment_totals_trigger ON public.order_payments;
CREATE TRIGGER update_payment_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_payment_totals();

-- Step 8: Add updated_at trigger for order_payments
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Initialize balance_due for existing orders
UPDATE public.orders
SET 
  total_paid = COALESCE(total_paid, 0),
  balance_due = total - COALESCE(total_paid, 0)
WHERE balance_due IS NULL;

-- Step 10: Verify setup
SELECT 
  'order_payments table' as item,
  COUNT(*) as count
FROM public.order_payments
UNION ALL
SELECT 
  'orders with payment tracking' as item,
  COUNT(*) as count
FROM public.orders
WHERE total_paid IS NOT NULL;

-- Expected result: 
-- order_payments table: 0 (no payments yet)
-- orders with payment tracking: (number of existing orders)
