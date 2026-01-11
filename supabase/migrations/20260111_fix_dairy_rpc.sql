-- Function to increment likes or shares securely
CREATE OR REPLACE FUNCTION public.increment_dairy_stat(post_id UUID, stat_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with high privileges to bypass RLS for this specific action
AS $$
BEGIN
    IF stat_type = 'like' THEN
        UPDATE public.client_dairy
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = post_id;
    ELSIF stat_type = 'share' THEN
        UPDATE public.client_dairy
        SET shares_count = COALESCE(shares_count, 0) + 1,
            last_shared_at = now()
        WHERE id = post_id;
    END IF;
END;
$$;

-- Grant execution to public so users can like/share
GRANT EXECUTE ON FUNCTION public.increment_dairy_stat(UUID, TEXT) TO anon, authenticated;
