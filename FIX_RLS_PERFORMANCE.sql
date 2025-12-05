-- ============================================
-- FIX RLS PERFORMANCE ISSUES
-- Optimizes Row Level Security policies by wrapping auth functions in SELECT
-- Run this in Supabase SQL Editor to fix all performance warnings
-- ============================================

-- ============================================
-- 1. PROFILES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 2. USER_ROLES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin((SELECT auth.uid())));

-- ============================================
-- 3. PRODUCTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 4. ORDERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 5. HERO_SLIDES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all hero slides" ON public.hero_slides;
CREATE POLICY "Admins can view all hero slides"
  ON public.hero_slides FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 6. PAYMENT_METHODS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.payment_methods;
CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- 7. PROMOTIONAL_BANNERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all banners" ON public.promotional_banners;
CREATE POLICY "Admins can view all banners"
  ON public.promotional_banners FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can manage banners" ON public.promotional_banners;
CREATE POLICY "Admins can manage banners"
  ON public.promotional_banners FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- ============================================
-- MIGRATION COMPLETE
-- All RLS policies optimized for better performance
-- The warnings in Supabase dashboard should disappear
-- ============================================
