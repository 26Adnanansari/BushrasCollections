-- Fix relationships for Social Analytics
-- Add explicit foreign key to profiles so PostgREST can perform joins
ALTER TABLE public.site_activity 
DROP CONSTRAINT IF EXISTS site_activity_user_id_fkey;

ALTER TABLE public.site_activity
ADD CONSTRAINT site_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Note: Since entity_id is polymorphic, we can't easily add a single FK.
-- But we can add two optional FKs for better PostgREST support if we want easy joins.
-- However, standard practice for polymorphic is to handle in code or use separate columns.
-- To keep it simple for PostgREST, let's add two nullable FK columns.

ALTER TABLE public.site_activity 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS dairy_id UUID REFERENCES public.client_dairy(id) ON DELETE CASCADE;

-- Update the RPC to populate these columns
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
        dairy_id
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        current_uid,
        p_type,
        p_platform,
        p_target,
        v_product_id,
        v_dairy_id
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
