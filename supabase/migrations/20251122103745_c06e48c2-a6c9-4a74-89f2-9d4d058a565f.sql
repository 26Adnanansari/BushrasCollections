-- Create payment method type enum
CREATE TYPE payment_method_type AS ENUM ('manual', 'gateway', 'offline');

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type payment_method_type NOT NULL DEFAULT 'manual',
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  instructions TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods
  FOR ALL
  USING (is_admin(auth.uid()));

-- Add payment_method_id to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN payment_status TEXT DEFAULT 'pending_payment',
ADD COLUMN transaction_id TEXT;

-- Update trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default "Contact Payment" method
INSERT INTO public.payment_methods (name, type, instructions, is_active, display_order)
VALUES (
  'Contact Payment',
  'manual',
  'Please contact us at your convenience to complete payment and confirm delivery details. We will reach out to you shortly.',
  true,
  1
);