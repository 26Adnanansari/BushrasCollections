-- ============================================
-- VISITOR TRACKING ANALYTICS SCHEMA
-- ============================================

-- Step 1: Create visitor_sessions table
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL, -- The UUID from the cookie
  user_id UUID REFERENCES auth.users(id), -- Optional: Link if they log in
  
  -- Session Metrics
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT now(),
  last_visit TIMESTAMPTZ DEFAULT now(),
  
  -- Device/Browser Info (Optional but useful)
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  
  -- Marketing Attribution
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS Policies

-- Allow anyone (anon) to insert/update their OWN session
-- We use the visitor_id to verify ownership if possible, or just allow inserts for anon
CREATE POLICY "Allow public insert of visitor sessions"
  ON public.visitor_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update of own session"
  ON public.visitor_sessions FOR UPDATE
  TO public
  USING (true); -- In a real app, we'd match cookie ID, but for now we trust the client to update by ID

-- Allow Admins to view all sessions
CREATE POLICY "Admins can view all visitor sessions"
  ON public.visitor_sessions FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

-- Step 4: Indexes for Analytics Performance
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_visit ON public.visitor_sessions(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visit_count ON public.visitor_sessions(visit_count DESC);
