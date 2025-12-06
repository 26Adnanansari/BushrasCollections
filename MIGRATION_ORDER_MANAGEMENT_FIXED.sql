-- ============================================
-- FIXED ORDER MANAGEMENT SYSTEM - DATABASE MIGRATION
-- Phase 1: Enhanced Order & Customer Data
-- ============================================
-- FIX: Added phone and whatsapp_number columns BEFORE view creation

-- ============================================
-- 1. UPDATE ORDERS TABLE
-- ============================================

-- Add WhatsApp and contact information
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT;

-- Add detailed shipping address (JSONB for flexibility)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Add order tracking fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Add marketing data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_source TEXT, -- 'organic', 'facebook', 'instagram', 'whatsapp', 'referral'
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add notes field for admin
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================
-- 2. UPDATE PROFILES TABLE
-- ============================================

-- CRITICAL FIX: Add phone and WhatsApp fields FIRST (before view creation)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add marketing preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp';

-- Add customer segmentation data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS customer_segment TEXT DEFAULT 'new', -- 'new', 'returning', 'vip', 'inactive'
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;

-- Add saved addresses (array of addresses)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 3. CREATE ORDER TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at DESC);

-- ============================================
-- 4. CREATE MARKETING CAMPAIGNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'whatsapp', 'email', 'sms'
  target_segment TEXT, -- 'new', 'returning', 'vip', 'inactive', 'all'
  message_template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'failed'
  recipients_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.marketing_campaigns(created_at DESC);

-- ============================================
-- 5. CREATE CUSTOMER SEGMENTS VIEW
-- ============================================
-- NOW SAFE: phone and whatsapp_number columns exist

CREATE OR REPLACE VIEW public.customer_segments_view AS
SELECT 
  p.id as user_id,
  p.name,
  p.email,
  p.phone,
  p.whatsapp_number,
  p.customer_segment,
  p.total_orders,
  p.total_spent,
  p.last_order_date,
  p.marketing_consent,
  p.whatsapp_consent,
  CASE 
    WHEN p.last_order_date IS NULL THEN 'new'
    WHEN p.last_order_date < NOW() - INTERVAL '90 days' THEN 'inactive'
    WHEN p.total_orders >= 5 OR p.total_spent >= 50000 THEN 'vip'
    WHEN p.total_orders >= 2 THEN 'returning'
    ELSE 'new'
  END as calculated_segment
FROM public.profiles p;

-- ============================================
-- 6. CREATE FUNCTION TO UPDATE CUSTOMER STATS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update customer statistics when order is created or updated
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'delivered' THEN
    UPDATE public.profiles
    SET 
      total_orders = (
        SELECT COUNT(*) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total), 0) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      last_order_date = NEW.created_at,
      customer_segment = CASE 
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 5 
          OR (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 50000 
          THEN 'vip'
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 2 
          THEN 'returning'
        ELSE 'new'
      END
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.orders;
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- ============================================
-- 7. UPDATE RLS POLICIES
-- ============================================

-- Order tracking policies
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own order tracking" ON public.order_tracking;
CREATE POLICY "Users can view their own order tracking"
  ON public.order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_tracking.order_id 
      AND orders.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all order tracking" ON public.order_tracking;
CREATE POLICY "Admins can manage all order tracking"
  ON public.order_tracking FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Marketing campaigns policies
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.marketing_campaigns;
CREATE POLICY "Admins can manage campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get order statistics by date range
CREATE OR REPLACE FUNCTION public.get_order_stats(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  pending_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(total), 0) as total_revenue,
    COALESCE(AVG(total), 0) as avg_order_value,
    COUNT(*) FILTER (WHERE status IN ('pending', 'pending_confirmation'))::BIGINT as pending_orders,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders
  FROM public.orders
  WHERE created_at BETWEEN start_date AND end_date;
END;
$$;

-- Function to get customer list by segment
CREATE OR REPLACE FUNCTION public.get_customers_by_segment(
  segment_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  total_orders INTEGER,
  total_spent NUMERIC,
  last_order_date TIMESTAMPTZ,
  customer_segment TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    COALESCE(p.whatsapp_number, p.phone) as whatsapp_number,
    p.total_orders,
    p.total_spent,
    p.last_order_date,
    p.customer_segment
  FROM public.profiles p
  WHERE 
    CASE 
      WHEN segment_filter = 'all' THEN true
      ELSE p.customer_segment = segment_filter
    END
  ORDER BY p.total_spent DESC, p.last_order_date DESC NULLS LAST;
END;
$$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Add comments for documentation
COMMENT ON COLUMN public.orders.whatsapp_number IS 'Customer WhatsApp number for order confirmation';
COMMENT ON COLUMN public.orders.shipping_address IS 'JSON object: {street, city, state, postal_code, country, landmark}';
COMMENT ON COLUMN public.orders.customer_source IS 'Marketing source: organic, facebook, instagram, whatsapp, referral';
COMMENT ON TABLE public.order_tracking IS 'Track order status changes and location updates';
COMMENT ON TABLE public.marketing_campaigns IS 'Marketing campaigns for customer engagement';
COMMENT ON FUNCTION public.update_customer_stats() IS 'Auto-update customer statistics when orders are delivered';
