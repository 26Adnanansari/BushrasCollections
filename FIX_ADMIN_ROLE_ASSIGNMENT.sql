-- ============================================
-- FIX: Allow Admins to Manage User Roles
-- ============================================
-- This fixes the issue where regular admins cannot assign admin roles to users
-- Error: 400 when trying to insert into user_roles table

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- Create new policy that allows both admins and super admins to manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- This allows any admin (including super_admin) to:
-- - INSERT new roles
-- - UPDATE existing roles  
-- - DELETE roles
-- - SELECT roles (already covered by other policies)

-- Note: The is_admin() function returns true for both 'admin' and 'super_admin' roles
