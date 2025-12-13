-- Enable the pg_trgm extension if not already enabled (useful for fuzzy matching if needed, though we use tsvector here)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a generated column for text search capabilities
-- combining name, description, and potentially brand/category if they exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS searchable tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Create a GIN index for fast searching
CREATE INDEX IF NOT EXISTS products_searchable_idx ON public.products USING GIN (searchable);

-- Create the search function
CREATE OR REPLACE FUNCTION search_products(query_text text)
RETURNS SETOF public.products
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.products
  WHERE searchable @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank(searchable, websearch_to_tsquery('english', query_text)) DESC
  LIMIT 20;
$$;
