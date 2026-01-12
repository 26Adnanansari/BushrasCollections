-- Enforce One Post Per Order and Add Referral Tracking

-- 1. Identify and remove any duplicate posts for the same order (keeping only the newest)
DELETE FROM public.client_dairy
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY order_id ORDER BY created_at DESC) as rn
        FROM public.client_dairy
        WHERE order_id IS NOT NULL
    ) t WHERE t.rn > 1
);

-- 2. Add Unique Constraint to prevent future duplicates
-- This ensures one order_id can only appear once in client_dairy
ALTER TABLE public.client_dairy 
ADD CONSTRAINT unique_order_moment UNIQUE (order_id);

-- 3. Update site_activity for referral tracking
ALTER TABLE public.site_activity
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_conversion BOOLEAN DEFAULT false;

-- 4. Update the universal function to support referral attribution
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
    current_uid := auth.uid();

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

    -- Increment counts
    IF p_entity_type = 'client_dairy' THEN
        IF p_type = 'like' THEN
            UPDATE public.client_dairy SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_entity_id;
        ELSIF p_type = 'share' THEN
            UPDATE public.client_dairy SET shares_count = COALESCE(shares_count, 0) + 1, last_shared_at = now() WHERE id = p_entity_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;
