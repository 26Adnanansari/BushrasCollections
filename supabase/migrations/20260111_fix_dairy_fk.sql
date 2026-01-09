-- Fix foreign key relationship for client_dairy to allow profile joining
ALTER TABLE public.client_dairy 
DROP CONSTRAINT IF EXISTS client_dairy_user_id_fkey;

ALTER TABLE public.client_dairy
ADD CONSTRAINT client_dairy_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
