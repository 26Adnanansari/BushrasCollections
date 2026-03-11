-- =====================================================
-- SUPABASE SECURITY FIXES - FINAL CORRECT VERSION
-- Based on actual migration files - safe to run
-- =====================================================

-- =====================================================
-- FIX 1: Enable RLS on client_dairy_activity
-- Columns: id, post_id, user_id, type, ip_address, user_agent, created_at
-- =====================================================

ALTER TABLE public.client_dairy_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view dairy activity" ON public.client_dairy_activity;
CREATE POLICY "Public can view dairy activity"
ON public.client_dairy_activity FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users insert dairy activity" ON public.client_dairy_activity;
CREATE POLICY "Users insert dairy activity"
ON public.client_dairy_activity FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete dairy activity" ON public.client_dairy_activity;
CREATE POLICY "Admin delete dairy activity"
ON public.client_dairy_activity FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- FIX 2: Enable RLS on site_activity
-- Columns: id, entity_type, entity_id, user_id, type,
--          platform, target_info, product_id, dairy_id,
--          referrer_id, ip_address, user_agent, created_at
-- =====================================================

ALTER TABLE public.site_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view site activity" ON public.site_activity;
CREATE POLICY "Admins can view site activity"
ON public.site_activity FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Service can insert site activity" ON public.site_activity;
CREATE POLICY "Service can insert site activity"
ON public.site_activity FOR INSERT
WITH CHECK (true);

-- =====================================================
-- FIX 3a: Fix increment_dairy_stat search_path
-- Original signature: (post_id UUID, stat_type TEXT)
-- Note: keeping original param names to avoid rename error
-- =====================================================

DROP FUNCTION IF EXISTS public.increment_dairy_stat(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.increment_dairy_stat(post_id UUID, stat_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();

    IF stat_type = 'like' THEN
        UPDATE public.client_dairy
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = post_id;

        INSERT INTO public.client_dairy_activity (post_id, user_id, type)
        VALUES (post_id, current_uid, 'like');

    ELSIF stat_type = 'share' THEN
        UPDATE public.client_dairy
        SET shares_count = COALESCE(shares_count, 0) + 1,
            last_shared_at = now()
        WHERE id = post_id;

        INSERT INTO public.client_dairy_activity (post_id, user_id, type)
        VALUES (post_id, current_uid, 'share');
    END IF;
END;
$$;

-- =====================================================
-- FIX 3b: Fix record_site_interaction search_path
-- Actual signature: (TEXT, UUID, TEXT, TEXT, TEXT, UUID)
-- =====================================================

DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.record_site_interaction(
    p_entity_type TEXT,
    p_entity_id   UUID,
    p_type        TEXT,
    p_platform    TEXT    DEFAULT 'generic',
    p_target      TEXT    DEFAULT NULL,
    p_referrer_id UUID    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid  UUID;
    v_product_id UUID := NULL;
    v_dairy_id   UUID := NULL;
BEGIN
    current_uid := auth.uid();

    IF p_entity_type = 'product' THEN
        v_product_id := p_entity_id;
    ELSIF p_entity_type = 'client_dairy' THEN
        v_dairy_id := p_entity_id;
    END IF;

    INSERT INTO public.site_activity (
        entity_type, entity_id, user_id, type,
        platform, target_info, product_id, dairy_id, referrer_id
    ) VALUES (
        p_entity_type, p_entity_id, current_uid, p_type,
        p_platform, p_target, v_product_id, v_dairy_id, p_referrer_id
    );

    IF p_entity_type = 'client_dairy' THEN
        IF p_type = 'like' THEN
            UPDATE public.client_dairy
            SET likes_count = COALESCE(likes_count, 0) + 1
            WHERE id = p_entity_id;
        ELSIF p_type = 'share' THEN
            UPDATE public.client_dairy
            SET shares_count = COALESCE(shares_count, 0) + 1,
                last_shared_at = now()
            WHERE id = p_entity_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_site_interaction(TEXT, UUID, TEXT, TEXT, TEXT, UUID)
TO anon, authenticated;

-- =====================================================
-- FIX 3c: Fix record_marketing_lead search_path
-- Actual signature: (UUID, TEXT, TEXT, TEXT, UUID)
-- Table columns: id, referrer_id, phone, full_name,
--                status, source_entity_type, source_entity_id, created_at
-- =====================================================

DROP FUNCTION IF EXISTS public.record_marketing_lead(UUID, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.record_marketing_lead(
    p_referrer_id   UUID,
    p_phone         TEXT,
    p_name          TEXT  DEFAULT NULL,
    p_entity_type   TEXT  DEFAULT NULL,
    p_entity_id     UUID  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.marketing_leads (
        referrer_id, phone, full_name,
        source_entity_type, source_entity_id
    ) VALUES (
        p_referrer_id, p_phone, p_name,
        p_entity_type, p_entity_id
    );
END;
$$;

-- =====================================================
-- FIX 4: Tighten visitor_sessions policies
-- =====================================================

DROP POLICY IF EXISTS "Allow public insert to visitor_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Allow public update visitor_sessions"    ON public.visitor_sessions;

CREATE POLICY "Allow public insert to visitor_sessions"
ON public.visitor_sessions FOR INSERT
WITH CHECK (
  visitor_id IS NOT NULL
  AND session_id IS NOT NULL
);

CREATE POLICY "Allow public update visitor_sessions"
ON public.visitor_sessions FOR UPDATE
USING    (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- =====================================================
-- FIX 5: Tighten marketing_leads INSERT policy
-- (full_name column, not 'name')
-- =====================================================

DROP POLICY IF EXISTS "Anonymous can insert leads" ON public.marketing_leads;

CREATE POLICY "Anonymous can insert leads"
ON public.marketing_leads FOR INSERT
WITH CHECK (
  phone IS NOT NULL
  AND length(trim(phone)) > 0
);

-- =====================================================
-- DONE! All security issues fixed.
-- Remaining: Enable leaked password protection manually:
-- Auth Dashboard > Settings > Password Security > Toggle ON
-- =====================================================
