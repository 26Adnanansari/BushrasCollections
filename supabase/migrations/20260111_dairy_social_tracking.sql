-- Add platform tracking to dairy activity
ALTER TABLE public.client_dairy_activity 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'generic',
ADD COLUMN IF NOT EXISTS target_info TEXT;

-- Update the RPC to handle platform data
CREATE OR REPLACE FUNCTION public.increment_dairy_stat(
    post_id UUID, 
    stat_type TEXT, 
    p_platform TEXT DEFAULT 'generic',
    p_target TEXT DEFAULT NULL
)
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
        INSERT INTO public.client_dairy_activity (post_id, user_id, type, platform)
        VALUES (post_id, current_uid, 'like', p_platform);

    ELSIF stat_type = 'share' THEN
        -- Increment count
        UPDATE public.client_dairy
        SET shares_count = COALESCE(shares_count, 0) + 1,
            last_shared_at = now()
        WHERE id = post_id;

        -- Log entry
        INSERT INTO public.client_dairy_activity (post_id, user_id, type, platform, target_info)
        VALUES (post_id, current_uid, 'share', p_platform, p_target);
    END IF;
END;
$$;
