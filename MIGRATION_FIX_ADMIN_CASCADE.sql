-- EMERGENCY FIX: Rebuild is_admin() and all dependent RLS policies
-- This migration uses CASCADE to drop everything and rebuild correctly

-- STEP 1: Drop the broken is_admin() function and ALL dependent policies
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;

-- STEP 2: Recreate is_admin() function correctly (checking user_roles table)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(_user_id, auth.uid())
    AND role IN ('admin', 'super_admin')
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin or super_admin role';

-- STEP 3: Recreate RLS policies for all affected tables
-- Note: Only recreating admin-related policies, user policies should still exist

-- Reviews table admin policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Admins can manage all reviews'
  ) THEN
    CREATE POLICY "Admins can manage all reviews"
    ON public.reviews
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- User roles table admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
    ON public.user_roles
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Products table admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Admins can manage products'
  ) THEN
    CREATE POLICY "Admins can manage products"
    ON public.products
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Hero slides admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hero_slides' 
    AND policyname = 'Admins can manage hero slides'
  ) THEN
    CREATE POLICY "Admins can manage hero slides"
    ON public.hero_slides
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Promotional banners admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotional_banners' 
    AND policyname = 'Admins can manage banners'
  ) THEN
    CREATE POLICY "Admins can manage banners"
    ON public.promotional_banners
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Payment methods admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_methods' 
    AND policyname = 'Admins can manage payment methods'
  ) THEN
    CREATE POLICY "Admins can manage payment methods"
    ON public.payment_methods
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Order items admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Admins can view all order items'
  ) THEN
    CREATE POLICY "Admins can view all order items"
    ON public.order_items
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Order payments admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_payments' 
    AND policyname = 'Admins can manage payments'
  ) THEN
    CREATE POLICY "Admins can manage payments"
    ON public.order_payments
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Visitor sessions admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'visitor_sessions' 
    AND policyname = 'Admins can view all sessions'
  ) THEN
    CREATE POLICY "Admins can view all sessions"
    ON public.visitor_sessions
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Orders admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Admins can view all orders'
  ) THEN
    CREATE POLICY "Admins can view all orders"
    ON public.orders
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Admins can update orders'
  ) THEN
    CREATE POLICY "Admins can update orders"
    ON public.orders
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Profiles admin policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update profiles'
  ) THEN
    CREATE POLICY "Admins can update profiles"
    ON public.profiles
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;
