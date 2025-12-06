-- ============================================
-- STEP 1: Add Phone and WhatsApp Columns
-- ============================================
-- Run this FIRST and WAIT for success before running Step 2

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Verify columns were added (should show both columns)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone', 'whatsapp_number');

-- Expected result: 2 rows showing phone and whatsapp_number
