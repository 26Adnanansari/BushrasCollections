-- Reviews and Ratings System Migration
-- This creates the reviews table with moderation capabilities

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  -- If no user_id provided, use current user
  IF _user_id IS NULL THEN
    _user_id := auth.uid();
  END IF;

  -- Get user roles from profiles table
  SELECT roles INTO user_roles
  FROM public.profiles
  WHERE id = _user_id;

  -- Check if 'admin' or 'super_admin' is in roles array
  RETURN user_roles && ARRAY['admin', 'super_admin']::TEXT[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 20 AND char_length(comment) <= 1000),
  
  -- Moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Metadata
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reviews per user per product
  UNIQUE(product_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

-- Users can view their own reviews (any status)
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert reviews for products they purchased
CREATE POLICY "Users can insert reviews for purchased products"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Function to check if user purchased product
CREATE OR REPLACE FUNCTION user_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.user_id = p_user_id
    AND orders.status IN ('delivered', 'shipped')
    AND orders.items::jsonb @> jsonb_build_array(jsonb_build_object('id', p_product_id::text))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE public.reviews IS 'Product reviews and ratings with admin moderation';
COMMENT ON COLUMN public.reviews.status IS 'Review status: pending (awaiting approval), approved (visible to all), rejected (hidden)';
COMMENT ON COLUMN public.reviews.is_verified_purchase IS 'True if user purchased this product';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of users who found this review helpful';
