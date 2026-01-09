-- Shipping Settings Table
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    base_cost DECIMAL(10,2) DEFAULT 0,
    min_order_amount DECIMAL(10,2), -- For free shipping or discounts
    estimated_days TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Offers / Coupons Table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Select policies for everyone
CREATE POLICY "Anyone can view active shipping" ON public.shipping_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active offers" ON public.offers FOR SELECT USING (is_active = true);

-- Admin policies
CREATE POLICY "Admins can manage shipping" ON public.shipping_methods FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'super_admin'))
);

CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'super_admin'))
);
