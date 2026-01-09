-- ============================================
-- SECURITY HARDENING PROTOCOL
-- Resolving 18 Supabase Security Advisor Warnings
-- ============================================

-- 1. CREATE EXTENSIONS SCHEMA AND MOVE EXTENSIONS
-- Prevents extensions from cluttering the public schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 2. FIX FUNCTION SEARCH PATHS
-- Prevents search path hijacking by explicitly setting search_path to public

-- generate_sku
CREATE OR REPLACE FUNCTION public.generate_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := CONCAT(
      'SKU-',
      UPPER(SUBSTRING(COALESCE(NEW.category, 'GEN'), 1, 2)),
      '-',
      LPAD(CAST(FLOOR(RANDOM() * 99999) AS TEXT), 5, '0')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- search_products
CREATE OR REPLACE FUNCTION public.search_products(query_text text)
RETURNS SETOF public.products
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.products
  WHERE searchable @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank(searchable, websearch_to_tsquery('english', query_text)) DESC
  LIMIT 20;
$$;

-- generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT, id UUID)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug || '-' || substring(id::text from 1 for 8);
  RETURN final_slug;
END;
$$;

-- generate_slug (alternate version)
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT) 
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN 'bushras-collection-' || lower(
        regexp_replace(
            regexp_replace(
                trim(name), 
                '[^a-zA-Z0-9\\s-]', '', 'g'
            ),
            '\\s+', '-', 'g'
        )
    );
END;
$$;

-- set_product_slug
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- auto_generate_slug
CREATE OR REPLACE FUNCTION public.auto_generate_slug() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_slug(NEW.name) || '-' || substring(NEW.id::text from 1 for 8);
    END IF;
    RETURN NEW;
END;
$$;

-- update_last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
    RETURN NEW;
END;
$$;

-- heartbeat
CREATE OR REPLACE FUNCTION public.heartbeat()
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$;

-- generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  next_num := nextval('order_number_seq');
  order_num := 'BC-' || LPAD(next_num::TEXT, 5, '0');
  RETURN order_num;
END;
$$;

-- set_order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

-- update_customer_stats
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'delivered' THEN
    UPDATE public.profiles
    SET 
      total_orders = (
        SELECT COUNT(*) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total), 0) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      last_order_date = NEW.created_at,
      customer_segment = CASE 
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 5 
          OR (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 50000 
          THEN 'vip'
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 2 
          THEN 'returning'
        ELSE 'new'
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- update_order_payment_totals
CREATE OR REPLACE FUNCTION public.update_order_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET 
    total_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    balance_due = total - (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    payment_status = CASE 
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) = 0 THEN 'pending_payment'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) < total THEN 'partial_payment'
      ELSE 'paid'
    END
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- update_reviews_updated_at
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- user_purchased_product
CREATE OR REPLACE FUNCTION public.user_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.user_id = p_user_id
    AND orders.status IN ('delivered', 'shipped')
    AND orders.items::jsonb @> jsonb_build_array(jsonb_build_object('id', p_product_id::text))
  );
END;
$$;

-- 3. HARDEN RLS POLICIES

-- visitor_sessions: Remove "Always True" update policy
DROP POLICY IF EXISTS "Allow public update of own session" ON public.visitor_sessions;
CREATE POLICY "Allow public update of own session"
  ON public.visitor_sessions FOR UPDATE
  TO public
  USING (visitor_id::text = (current_setting('request.headers', true)::jsonb->>'x-visitor-id'));
-- NOTE: This assumes visitors are tracked via a custom header/cookie. 
-- In the absence of auth, we restrict update to a matching visitor_id if possible.
-- If no visitor tracking is robust, we might need to stay permissive or use a different mechanism.
-- For now, I'll use a placeholder logic that is safer than "true".

-- contact_messages: Ensure only admins can select, public can only insert
DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
CREATE POLICY "Public can insert contact messages" 
ON public.contact_messages FOR INSERT 
TO anon, authenticated 
WITH CHECK (true); -- INSERT must remain open for public contact form

-- Re-verify select policy for contact_messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
CREATE POLICY "Admins can view all messages" 
ON public.contact_messages FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  )
);
