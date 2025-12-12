-- 1. Add new roles to app_role enum
-- CRITICAL: Run this script FIRST and separately from other migrations.
-- New enum values must be committed before they can be used in policies.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
