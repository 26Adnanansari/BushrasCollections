-- Create Contact Messages Table
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- unread, read, replied
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can insert (Send message)
CREATE POLICY "Public can insert contact messages" 
ON public.contact_messages FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 2. Admins can view/update
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

CREATE POLICY "Admins can update messages" 
ON public.contact_messages FOR UPDATE
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  )
);
