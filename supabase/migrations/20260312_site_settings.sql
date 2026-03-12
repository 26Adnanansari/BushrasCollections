-- Create site_settings table for dynamic configuration (Facebook Pixel, Google Maps, etc)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (needed for front-end tracking scripts)
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can manage settings
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Insert initial empty settings for facebook_pixel and google_maps
INSERT INTO public.site_settings (key, value)
VALUES 
  ('facebook_pixel', '{"pixel_id": ""}'::jsonb),
  ('google_maps', '{"locations": [{"name": "Outlet 1", "url": "https://maps.app.goo.gl/zap2xynJQnH3tic87"}, {"name": "Outlet 2", "url": "https://maps.app.goo.gl/WDyVi91bFT9ipcoA9"}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
