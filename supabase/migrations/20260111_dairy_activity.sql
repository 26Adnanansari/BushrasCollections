-- Create table for tracking individual interactions
CREATE TABLE IF NOT EXISTS public.client_dairy_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.client_dairy(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'share')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast counts
CREATE INDEX IF NOT EXISTS idx_dairy_activity_post_id ON public.client_dairy_activity(post_id);

-- Update the RPC to also log the activity
CREATE OR REPLACE FUNCTION public.increment_dairy_stat(post_id UUID, stat_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();

    IF stat_type = 'like' THEN
        -- Increment count
        UPDATE public.client_dairy
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = post_id;
        
        -- Log entry
        INSERT INTO public.client_dairy_activity (post_id, user_id, type)
        VALUES (post_id, current_uid, 'like');

    ELSIF stat_type = 'share' THEN
        -- Increment count
        UPDATE public.client_dairy
        SET shares_count = COALESCE(shares_count, 0) + 1,
            last_shared_at = now()
        WHERE id = post_id;

        -- Log entry
        INSERT INTO public.client_dairy_activity (post_id, user_id, type)
        VALUES (post_id, current_uid, 'share');
    END IF;
END;
$$;
