-- Ensure slug column exists and is unique
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN 'bushras-collection-' || lower(
        regexp_replace(
            regexp_replace(
                trim(name), 
                '[^a-zA-Z0-9\\s-]', '', 'g' -- Remove special chars
            ),
            '\\s+', '-', 'g' -- Replace spaces with dashes
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Populate existing products with slugs
UPDATE public.products 
SET slug = generate_slug(name) || '-' || substring(id::text from 1 for 8) -- Append partial UUID to ensure uniqueness
WHERE slug IS NULL OR slug = '' OR slug NOT LIKE 'bushras-collection-%';

-- Create Trigger to auto-generate slug on insert if missing
CREATE OR REPLACE FUNCTION public.auto_generate_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name) || '-' || substring(NEW.id::text from 1 for 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON public.products;
CREATE TRIGGER trigger_auto_generate_slug
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_slug();
