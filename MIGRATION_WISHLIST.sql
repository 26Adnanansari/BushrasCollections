-- Create Wishlist Table
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own wishlist
CREATE POLICY "Users can view own wishlist" 
ON public.wishlist FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Users can add items to their own wishlist
CREATE POLICY "Users can insert into own wishlist" 
ON public.wishlist FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can remove items from their own wishlist
CREATE POLICY "Users can delete from own wishlist" 
ON public.wishlist FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
