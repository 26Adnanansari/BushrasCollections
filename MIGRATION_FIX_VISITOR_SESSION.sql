-- Fix for 42P10 error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- This ensures visitor_id is unique so upsert operations work correctly

-- First, remove any duplicates if they exist (keeping the most recent)
DELETE FROM public.visitor_sessions a
USING public.visitor_sessions b
WHERE a.id < b.id
AND a.visitor_id = b.visitor_id;

-- Now add the unique constraint
ALTER TABLE public.visitor_sessions
ADD CONSTRAINT visitor_sessions_visitor_id_key UNIQUE (visitor_id);

-- Verify RLS polices allow anon updates (already exists in SINGLE_INIT but ensuring it handles conflicts)
-- The ON CONFLICT clause in the frontend code requires this unique constraint
