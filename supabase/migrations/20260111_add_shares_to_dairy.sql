-- Add shares_count to client_dairy
ALTER TABLE public.client_dairy 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Optional: Track where it was shared (if we want to log basic info)
ALTER TABLE public.client_dairy 
ADD COLUMN IF NOT EXISTS last_shared_at TIMESTAMPTZ;
