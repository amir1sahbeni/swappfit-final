-- Migration for Dynamic Sizing and Purchases linking

-- Add new columns to listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS size_type TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add purchase_id to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL;
