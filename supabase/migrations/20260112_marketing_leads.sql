-- 1. Create Marketing Leads table specifically for viral discovery
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.profiles(id),
    phone TEXT,
    full_name TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'bought'
    source_entity_type TEXT, -- 'product', 'client_dairy'
    source_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add RLS for leads (only admins can see them)
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing leads" 
ON public.marketing_leads 
FOR ALL 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE 'admin' = ANY(roles)));

CREATE POLICY "Anonymous can insert leads" 
ON public.marketing_leads 
FOR INSERT 
WITH CHECK (true);

-- 3. Function to record lead conversion
CREATE OR REPLACE FUNCTION public.record_marketing_lead(
    p_referrer_id UUID,
    p_phone TEXT,
    p_name TEXT DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.marketing_leads (
        referrer_id,
        phone,
        full_name,
        source_entity_type,
        source_entity_id
    )
    VALUES (
        p_referrer_id,
        p_phone,
        p_name,
        p_entity_type,
        p_entity_id
    );
END;
$$;
