-- Add phone verification status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.phone_verified IS 'Tracks whether user phone number has been verified via SMS';