-- ============================================
-- BUSHRAS COLLECTION - COMPLETE DATABASE SCHEMA
-- Single consolidated migration for fresh database setup
-- WITH BOUTIQUE ENHANCEMENTS
-- ============================================

-- ============================================
-- 1. CREATE CUSTOM TYPES
-- ============================================

CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin', 'moderator');
CREATE TYPE public.payment_method_type AS ENUM ('manual', 'gateway', 'offline');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  address JSONB,
  avatar_url TEXT,
  -- Marketing preferences
  marketing_consent BOOLEAN DEFAULT true,
  whatsapp_consent BOOLEAN DEFAULT true,
  preferred_contact_method TEXT DEFAULT 'whatsapp',
  -- Customer segmentation
  customer_segment TEXT DEFAULT 'new',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (CRITICAL: Separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Products table (WITH BOUTIQUE ENHANCEMENTS)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  list_price NUMERIC(10,2),
  brand TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  -- Boutique-specific fields (all optional)
  fabric_type TEXT,
  available_sizes JSONB DEFAULT '[]'::jsonb,
  available_colors JSONB DEFAULT '[]'::jsonb,
  care_instructions TEXT,
  occasion_type TEXT,
  embellishment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB,
  whatsapp_number TEXT,
  alternate_phone TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  customer_source TEXT,
  referral_code TEXT,
  admin_notes TEXT,
  payment_method_id UUID,
  payment_status TEXT DEFAULT 'pending_payment',
  transaction_id TEXT,
  
  -- Payment Tracking
  total_paid NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type payment_method_type NOT NULL DEFAULT 'manual',
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  instructions TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hero slides table
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotional banners table
CREATE TABLE public.promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items table (stores product details for each order)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_image TEXT,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order tracking table
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  target_segment TEXT,
  message_template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  recipients_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order payments table (tracks all payment transactions)
CREATE TABLE public.order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Payment details
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'online', 'other'
  payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  
  -- Bank transfer details (optional)
  bank_name TEXT,
  account_holder TEXT,
  transaction_id TEXT,
  transaction_proof_url TEXT, -- Screenshot/proof stored in Supabase Storage
  
  -- Metadata
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id), -- Admin who recorded it
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visitor sessions table (for analytics)
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL, -- The UUID from the cookie
  user_id UUID REFERENCES auth.users(id), -- Optional: Link if they log in
  
  -- Session Metrics
  visit_count INTEGER DEFAULT 1,
  first_visit TIMESTAMPTZ DEFAULT now(),
  last_visit TIMESTAMPTZ DEFAULT now(),
  
  -- Device/Browser Info
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


-- ============================================
-- 2B. ADD PAYMENT TRACKING COLUMNS TO ORDERS
-- (Moved to CREATE TABLE definition above)
-- ============================================


-- ============================================
-- 3. ADD FOREIGN KEYS (after all tables created)
-- ============================================

ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_method_id_fkey 
FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin (admin or super_admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

$$;

-- Sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Auto-generate SKU if not provided
CREATE OR REPLACE FUNCTION public.generate_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := CONCAT(
      'SKU-',
      UPPER(SUBSTRING(COALESCE(NEW.category, 'GEN'), 1, 2)),
      '-',
      LPAD(CAST(FLOOR(RANDOM() * 99999) AS TEXT), 5, '0')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  next_num := nextval('order_number_seq');
  order_num := 'BC-' || LPAD(next_num::TEXT, 5, '0');
  RETURN order_num;
END;
$$;

-- Set order number trigger function
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Update customer stats function
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'delivered' THEN
    UPDATE public.profiles
    SET 
      total_orders = (
        SELECT COUNT(*) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total), 0) 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'delivered'
      ),
      last_order_date = NEW.created_at,
      customer_segment = CASE 
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 5 
          OR (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 50000 
          THEN 'vip'
        WHEN (SELECT COUNT(*) FROM public.orders WHERE user_id = NEW.user_id AND status = 'delivered') >= 2 
          THEN 'returning'
        ELSE 'new'
      END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Update order payment totals function
CREATE OR REPLACE FUNCTION public.update_order_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate total_paid and balance_due for the order
  UPDATE public.orders
  SET 
    total_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    balance_due = total - (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.order_payments
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      AND payment_status = 'completed'
    ),
    payment_status = CASE 
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) = 0 THEN 'pending_payment'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.order_payments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND payment_status = 'completed'
      ) < total THEN 'partial_payment'
      ELSE 'paid'
    END
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to sync email on user update
CREATE TRIGGER sync_email_on_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Triggers to auto-update updated_at columns
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.promotional_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to auto-generate SKU
CREATE TRIGGER generate_product_sku
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_sku();

-- Trigger to auto-generate order number
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger to update customer stats
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- Trigger to auto-update payment totals
CREATE TRIGGER update_payment_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_payment_totals();

-- Trigger to auto-update updated_at on order_payments
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;



-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin((SELECT auth.uid())));

-- Products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())));

-- Order payments policies
CREATE POLICY "Admins can view all payments"
  ON public.order_payments FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can insert payments"
  ON public.order_payments FOR INSERT
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update payments"
  ON public.order_payments FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can delete payments"
  ON public.order_payments FOR DELETE
  USING (public.is_admin((SELECT auth.uid())));

-- Hero slides policies
CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all hero slides"
  ON public.hero_slides FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Payment methods policies
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Promotional banners policies
CREATE POLICY "Anyone can view active banners"
  ON public.promotional_banners FOR SELECT
  USING (is_active = true AND 
         (start_date IS NULL OR start_date <= now()) AND 
         (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can view all banners"
  ON public.promotional_banners FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage banners"
  ON public.promotional_banners FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Order items policies
CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Order tracking policies
CREATE POLICY "Users can view their own order tracking"
  ON public.order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_tracking.order_id 
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can manage all order tracking"
  ON public.order_tracking FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- Marketing campaigns policies
-- Visitor sessions policies
-- Allow anyone (anon) to insert their OWN session
CREATE POLICY "Allow public insert of visitor sessions"
  ON public.visitor_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update of own session"
  ON public.visitor_sessions FOR UPDATE
  TO public
  USING (true);

-- Allow Admins to view all sessions
CREATE POLICY "Admins can view all visitor sessions"
  ON public.visitor_sessions FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));


-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Products indexes
CREATE INDEX idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_price ON public.products(price);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Order payments indexes
CREATE INDEX idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX idx_order_payments_created_at ON public.order_payments(created_at DESC);
CREATE INDEX idx_order_payments_payment_date ON public.order_payments(payment_date DESC);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_active ON public.payment_methods(is_active) WHERE is_active = true;
CREATE INDEX idx_payment_methods_display_order ON public.payment_methods(display_order);

-- Hero slides indexes
CREATE INDEX idx_hero_slides_active ON public.hero_slides(is_active, order_index) WHERE is_active = true;

-- Promotional banners indexes
CREATE INDEX idx_promotional_banners_active ON public.promotional_banners(is_active, display_order) WHERE is_active = true;
CREATE INDEX idx_promotional_banners_dates ON public.promotional_banners(start_date, end_date);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Order tracking indexes
CREATE INDEX idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX idx_order_tracking_created_at ON public.order_tracking(created_at DESC);

-- Marketing campaigns indexes
CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_campaigns_created_at ON public.marketing_campaigns(created_at DESC);

-- Visitor sessions indexes
CREATE INDEX idx_visitor_sessions_last_visit ON public.visitor_sessions(last_visit DESC);
CREATE INDEX idx_visitor_sessions_visit_count ON public.visitor_sessions(visit_count DESC);

-- Order number index (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);


-- ============================================
-- 9. CREATE STORAGE BUCKETS
-- ============================================

-- Product images bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Hero media bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-media', 
  'hero-media', 
  true, 
  10485760, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Order documents bucket (payment proofs, admin only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents', 
  'order-documents', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;



-- ============================================
-- 10. CREATE STORAGE POLICIES
-- ============================================

-- Product images policies
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Hero media policies
CREATE POLICY "Anyone can view hero media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hero-media');

CREATE POLICY "Authenticated users can upload hero media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hero-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hero media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hero-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete hero media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hero-media' AND auth.role() = 'authenticated');

-- Order documents policies (payment proofs)
CREATE POLICY "Anyone can view order documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-documents');

CREATE POLICY "Authenticated users can upload order documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- ============================================
-- 11. INSERT DEFAULT DATA
-- ============================================

-- Default payment method (REQUIRED - only essential data)
INSERT INTO public.payment_methods (name, type, instructions, is_active, display_order)
VALUES (
  'Contact Payment',
  'manual',
  'Please contact us at your convenience to complete payment and confirm delivery details. We will reach out to you shortly.',
  true,
  1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- SETUP COMPLETE ✓
-- All demo/dummy data removed for production
-- Boutique enhancements added (SKU, fabric, sizes, colors, etc.)
-- Add your own products through the admin UI
-- ============================================
