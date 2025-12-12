-- COMPREHENSIVE DATABASE FIX
-- This migration fixes all schema issues and RLS policies

-- ============================================
-- PART 1: Fix is_admin() Function with CASCADE
-- ============================================

-- Drop the broken is_admin() function and ALL dependent policies
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;

-- Recreate is_admin() function correctly (checking user_roles table)
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

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin or super_admin role';

-- ============================================
-- PART 2: Add Missing Columns to Products
-- ============================================

-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.products ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- Add payment_method column to orders if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- ============================================
-- PART 3: Create Slug Generation Functions
-- ============================================

-- Drop trigger first (it depends on the function)
DROP TRIGGER IF EXISTS products_set_slug ON public.products;

-- Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS public.generate_slug(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.set_product_slug() CASCADE;

-- Function to generate slug from product name
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT, id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from product name
  base_slug := lower(regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Trim and clean up
  base_slug := trim(both '-' from base_slug);
  
  -- Add product ID suffix for uniqueness
  final_slug := base_slug || '-' || substring(id::text from 1 for 8);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to set product slug
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic slug generation
DROP TRIGGER IF EXISTS products_set_slug ON public.products;
CREATE TRIGGER products_set_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_slug();

-- Generate slugs for existing products
UPDATE public.products
SET slug = generate_slug(name, id)
WHERE slug IS NULL;

-- ============================================
-- PART 4: Recreate All RLS Policies
-- ============================================

-- Reviews table policies
CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- User roles table policies
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Products table policies
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Hero slides policies
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Promotional banners policies
CREATE POLICY "Admins can manage banners"
ON public.promotional_banners FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Payment methods policies
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Order items policies
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (is_admin(auth.uid()));

-- Order payments policies
CREATE POLICY "Admins can manage payments"
ON public.order_payments FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Visitor sessions policies
CREATE POLICY "Admins can view all sessions"
ON public.visitor_sessions FOR SELECT
USING (is_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify is_admin() works
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- This should not error
  SELECT is_admin(auth.uid()) INTO test_result;
  RAISE NOTICE 'is_admin() function is working correctly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'is_admin() function test failed: %', SQLERRM;
END $$;
