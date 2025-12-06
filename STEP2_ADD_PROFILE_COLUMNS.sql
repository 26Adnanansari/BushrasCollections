-- ============================================
-- STEP 2: Add All Other Profile Columns
-- ============================================
-- Run this AFTER Step 1 succeeds

-- Add marketing preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp';

-- Add customer segmentation data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS customer_segment TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;

-- Add saved addresses
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- Verify all columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone', 'whatsapp_number', 'total_orders', 'total_spent', 'last_order_date', 'customer_segment');
