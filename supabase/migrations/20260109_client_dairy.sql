-- Create client_dairy table for social sharing
CREATE TABLE IF NOT EXISTS public.client_dairy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    content TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_dairy ENABLE ROW LEVEL SECURITY;

-- Allow users to view approved posts
CREATE POLICY "Anyone can view approved posts" 
ON public.client_dairy FOR SELECT 
USING (status = 'approved');

-- Allow users to insert their own posts
CREATE POLICY "Users can insert their own posts" 
ON public.client_dairy FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all posts
CREATE POLICY "Admins can manage all posts" 
ON public.client_dairy FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    )
);
