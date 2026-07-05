-- 1. Add new enum value for purchase requests
ALTER TYPE purchase_status ADD VALUE IF NOT EXISTS 'pending_seller_approval';

-- 2. Drop the automatic listing lock trigger from before,
-- since we only want to lock the listing when the seller accepts.
DROP TRIGGER IF EXISTS on_purchase_item_created ON public.purchase_items;
DROP FUNCTION IF EXISTS lock_listing_on_purchase();

-- 3. Just to be safe, re-apply GRANTS to the purchases and purchase_items tables
GRANT ALL ON TABLE public.purchases TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchase_items TO anon, authenticated, service_role;
