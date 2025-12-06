-- ============================================
-- STEP 3: Add Order Columns
-- ============================================
-- Run this AFTER Step 2 succeeds

-- Add WhatsApp and contact information to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT;

-- Add detailed shipping address
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Add order tracking fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Add marketing data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_source TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add notes field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
