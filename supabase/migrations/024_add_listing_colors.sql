-- Add color column to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS color text DEFAULT '';
