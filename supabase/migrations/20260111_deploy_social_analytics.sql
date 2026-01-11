-- ==========================================
-- UNIVERSAL SOCIAL ANALYTICS SCHEMA
-- ==========================================

-- 1. Create a universal activity log
CREATE TABLE IF NOT EXISTS public.site_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'product' or 'client_dairy'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'share', 'view')),
    platform TEXT DEFAULT 'generic', -- 'whatsapp', 'instagram', 'facebook', 'copy', etc.
    target_info TEXT, 
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexing for fast analytics
CREATE INDEX IF NOT EXISTS idx_site_activity_entity ON public.site_activity(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_site_activity_user ON public.site_activity(user_id);

-- 3. Secure RPC to record interactions
-- This handles likes and shares for BOTH Products and Client Dairy posts
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

    -- Insert into universal log
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

    -- Increment counts in specific tables to keep them in sync
    IF p_entity_type = 'client_dairy' THEN
        IF p_type = 'like' THEN
            UPDATE public.client_dairy SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_entity_id;
        ELSIF p_type = 'share' THEN
            UPDATE public.client_dairy SET shares_count = COALESCE(shares_count, 0) + 1, last_shared_at = now() WHERE id = p_entity_id;
        END IF;
    END IF;
    
    -- Note: Product liking/sharing counts can be added to the 'products' table in the future if needed.
    -- For now, they are fully tracked in the site_activity table.
END;
$$;

-- 4. Grant permissions for the RPC
GRANT EXECUTE ON FUNCTION public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
