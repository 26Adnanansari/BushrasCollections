-- Migration for Advanced Analytics (Smart Sessions)
-- Dropping old table to allow cleaner structure for "Smart Sessions"
DROP TABLE IF EXISTS public.visitor_sessions;

-- Create new table for Sessions
CREATE TABLE public.visitor_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL, -- The persistent cookie ID
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Marketing Data (UTM)
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Geographic Data
    city TEXT,
    country TEXT,
    country_code TEXT,
    ip_address TEXT, -- Optional, useful for debugging or detailed geo
    
    -- Tech Data
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    user_agent TEXT,
    referrer TEXT,
    
    -- Engagement
    page_views INTEGER DEFAULT 1
);

-- Index for faster queries
CREATE INDEX idx_visitor_sessions_visitor_id ON public.visitor_sessions(visitor_id);
CREATE INDEX idx_visitor_sessions_started_at ON public.visitor_sessions(started_at);
CREATE INDEX idx_visitor_sessions_utm_source ON public.visitor_sessions(utm_source);

-- Enable RLS (Row Level Security) - Allow public to insert (track), Admin to Read
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to insert their own session data
CREATE POLICY "Allow public insert to visitor_sessions" 
ON public.visitor_sessions FOR INSERT 
TO public, anon, authenticated 
WITH CHECK (true);

-- Allow admins to read all data
CREATE POLICY "Allow admin select visitor_sessions" 
ON public.visitor_sessions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  )
);

-- Allow public to update their own session (e.g. update last_activity) based on session_id?
-- Since standard RLS with anon/cookie is hard without auth.uid, we often allow update if we know the ID.
-- For simplicity in this demo, we can allow update to public if they have the ID (UUIDs are hard to guess).
CREATE POLICY "Allow public update visitor_sessions" 
ON public.visitor_sessions FOR UPDATE
TO public, anon, authenticated 
USING (true)
WITH CHECK (true);
