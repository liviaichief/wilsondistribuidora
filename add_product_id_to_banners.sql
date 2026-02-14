
-- Add product_id to banners table
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS product_id bigint REFERENCES public.products(id) ON DELETE SET NULL;
