-- ============================================
-- ADD EMAIL TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile with email from auth.users
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger to sync email on user creation
DROP TRIGGER IF EXISTS sync_email_on_signup ON auth.users;
CREATE TRIGGER sync_email_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- 4. Create trigger to sync email on user update
DROP TRIGGER IF EXISTS sync_email_on_update ON auth.users;
CREATE TRIGGER sync_email_on_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- 5. Backfill existing users' emails
UPDATE public.profiles p
SET email = (
  SELECT email 
  FROM auth.users u 
  WHERE u.id = p.id
)
WHERE p.email IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- Now profiles table will have real email addresses
-- ============================================
