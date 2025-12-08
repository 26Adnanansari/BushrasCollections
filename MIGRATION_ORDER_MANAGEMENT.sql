-- Migration: Order Management & Marketing System
-- Description: Adds tables and columns for order tracking, customer segmentation, and marketing campaigns.

-- 1. Update 'orders' table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_address JSONB, -- {street, city, state, postal_code, country, landmark}
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS customer_source TEXT, -- 'organic', 'facebook', 'instagram', 'whatsapp', 'referral'
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 2. Update 'profiles' table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'phone'
ADD COLUMN IF NOT EXISTS customer_segment TEXT, -- 'new', 'returning', 'vip', 'inactive'
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;

-- 3. Create 'customer_segments' table
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  segment TEXT NOT NULL, -- 'new', 'returning', 'vip', 'inactive'
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for customer_segments
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all segments
CREATE POLICY "Admins can view all customer segments"
ON public.customer_segments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- 4. Create 'marketing_campaigns' table
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for marketing_campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage campaigns
CREATE POLICY "Admins can manage marketing campaigns"
ON public.marketing_campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- 5. Create 'order_tracking' table
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tracking for their own orders
CREATE POLICY "Users can view tracking for their own orders"
ON public.order_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_tracking.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy: Admins can manage tracking
CREATE POLICY "Admins can manage order tracking"
ON public.order_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);
