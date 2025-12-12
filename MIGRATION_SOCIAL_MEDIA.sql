-- Add social media columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.facebook_url IS 'User Facebook profile URL (optional, for marketing purposes)';
COMMENT ON COLUMN public.profiles.instagram_url IS 'User Instagram profile URL (optional, for marketing purposes)';
COMMENT ON COLUMN public.profiles.tiktok_url IS 'User TikTok profile URL (optional, for marketing purposes)';
COMMENT ON COLUMN public.profiles.youtube_url IS 'User YouTube channel URL (optional, for marketing purposes)';
COMMENT ON COLUMN public.profiles.twitter_url IS 'User Twitter/X profile URL (optional, for marketing purposes)';

-- Create indexes for better query performance (only for non-null values)
CREATE INDEX IF NOT EXISTS idx_profiles_instagram ON public.profiles(instagram_url) WHERE instagram_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_facebook ON public.profiles(facebook_url) WHERE facebook_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok ON public.profiles(tiktok_url) WHERE tiktok_url IS NOT NULL;
