-- Create a universal activity log for all site entities (Products, Dairy, etc.)
CREATE TABLE IF NOT EXISTS public.site_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'product' or 'client_dairy'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'share', 'view')),
    platform TEXT DEFAULT 'generic', -- 'whatsapp', 'instagram', 'facebook', etc.
    target_info TEXT, -- Useful for WhatsApp numbers or specific target URLs
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast analytics
CREATE INDEX IF NOT EXISTS idx_site_activity_entity ON public.site_activity(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_site_activity_user ON public.site_activity(user_id);

-- Secure RPC to record interactions
CREATE OR REPLACE FUNCTION public.record_site_interaction(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_type TEXT,
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

    -- Insert into log
    INSERT INTO public.site_activity (
        entity_type,
        entity_id,
        user_id,
        type,
        platform,
        target_info
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        current_uid,
        p_type,
        p_platform,
        p_target
    );

    -- Increment counts in specific tables if applicable
    IF p_entity_type = 'client_dairy' THEN
        IF p_type = 'like' THEN
            UPDATE public.client_dairy SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_entity_id;
        ELSIF p_type = 'share' THEN
            UPDATE public.client_dairy SET shares_count = COALESCE(shares_count, 0) + 1, last_shared_at = now() WHERE id = p_entity_id;
        END IF;
    ELSIF p_entity_type = 'product' THEN
        -- We don't have counts in 'products' table yet, but we log the activity anyway.
        -- Future: ADD COLUMN likes_count, shares_count to products if needed.
        NULL;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
