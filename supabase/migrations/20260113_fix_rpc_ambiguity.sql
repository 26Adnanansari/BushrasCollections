-- Fix for Ambiguous record_site_interaction function
-- This migration drops old versions of the function to prevent "function is not unique" errors

-- 1. Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT, UUID);

-- 2. Create the unified 6-argument version
CREATE OR REPLACE FUNCTION public.record_site_interaction(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_type TEXT,
    p_platform TEXT DEFAULT 'generic',
    p_target TEXT DEFAULT NULL,
    p_referrer_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
    v_product_id UUID := NULL;
    v_dairy_id UUID := NULL;
BEGIN
    -- Use auth.uid() if logged in
    current_uid := auth.uid();

    -- Map polymorphic IDs to specific columns for easier joins in PostgREST
    IF p_entity_type = 'product' THEN
        v_product_id := p_entity_id;
    ELSIF p_entity_type = 'client_dairy' THEN
        v_dairy_id := p_entity_id;
    END IF;

    -- Insert into universal log
    INSERT INTO public.site_activity (
        entity_type,
        entity_id,
        user_id,
        type,
        platform,
        target_info,
        product_id,
        dairy_id,
        referrer_id
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        current_uid,
        p_type,
        p_platform,
        p_target,
        v_product_id,
        v_dairy_id,
        p_referrer_id
    );

    -- Increment counts in specific tables for performance
    IF p_entity_type = 'client_dairy' THEN
        IF p_type = 'like' THEN
            UPDATE public.client_dairy SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_entity_id;
        ELSIF p_type = 'share' THEN
            UPDATE public.client_dairy SET shares_count = COALESCE(shares_count, 0) + 1, last_shared_at = now() WHERE id = p_entity_id;
        END IF;
    END IF;
END;
$$;

-- 3. Restore permissions
GRANT EXECUTE ON FUNCTION public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
