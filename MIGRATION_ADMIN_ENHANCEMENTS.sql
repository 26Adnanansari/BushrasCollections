-- Migration for Admin Enhancements: Team Management & User Details

-- 1. Enhance profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- 2. Create recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- Prevent duplicate entries for same product
);

-- Enable RLS for recently_viewed
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Policies for recently_viewed
CREATE POLICY "Users can view their own history" ON public.recently_viewed
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" ON public.recently_viewed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all history" ON public.recently_viewed
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 3. Create staff_assignments table
CREATE TABLE IF NOT EXISTS public.staff_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes TEXT
);

-- Enable RLS for staff_assignments
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for staff_assignments
CREATE POLICY "Staff can view their assignments" ON public.staff_assignments
    FOR SELECT USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'manager')
        )
    );

CREATE POLICY "Admins can manage assignments" ON public.staff_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'manager')
        )
    );

-- 4. Function to update last_seen_at
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We can't easily trigger this on every SELECT, so we'll call it manually from the frontend or via an RPC.
-- Instead, let's create an RPC function for the frontend to call "heartbeat".

CREATE OR REPLACE FUNCTION public.heartbeat()
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
