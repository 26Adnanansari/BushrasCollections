-- Create hero_slides table
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
  ON public.hero_slides
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can manage slides"
  ON public.hero_slides
  FOR ALL
  USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for hero media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-media', 'hero-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hero media
CREATE POLICY "Anyone can view hero media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'hero-media');

CREATE POLICY "Admins can upload hero media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'hero-media' AND is_admin());

CREATE POLICY "Admins can update hero media"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'hero-media' AND is_admin());

CREATE POLICY "Admins can delete hero media"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'hero-media' AND is_admin());