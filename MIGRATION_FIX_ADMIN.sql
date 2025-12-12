-- Fix Admin Access Issues
-- This migration fixes the is_admin() function to work with the actual schema

-- Drop the incorrect version from MIGRATION_REVIEWS.sql
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create the correct version that checks user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If no user_id provided, use current user
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(_user_id, auth.uid())
    AND role IN ('admin', 'super_admin')
  )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin or super_admin role';
