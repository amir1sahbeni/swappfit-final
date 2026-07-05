-- Update purchase_status enum to replace pending_delivery with accepted
-- This is a complex migration because PostgreSQL doesn't support removing enum values

-- Step 1: Add a temporary text column to store current status values
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS status_temp text;

-- Step 2: Copy current status values to the temp column
UPDATE public.purchases SET status_temp = status::text;

-- Step 3: Drop the status column
ALTER TABLE public.purchases DROP COLUMN status;

-- Step 4: Drop and recreate the enum type
DROP TYPE IF EXISTS purchase_status CASCADE;

CREATE TYPE purchase_status AS ENUM ('pending_seller_approval', 'accepted', 'completed', 'cancelled');

-- Step 5: Add back the status column with the new enum type
ALTER TABLE public.purchases ADD COLUMN status purchase_status NOT NULL DEFAULT 'pending_seller_approval';

-- Step 6: Restore status values, converting pending_delivery to accepted
UPDATE public.purchases 
SET status = CASE 
  WHEN status_temp = 'pending_delivery' THEN 'accepted'::purchase_status
  WHEN status_temp = 'pending_seller_approval' THEN 'pending_seller_approval'::purchase_status
  WHEN status_temp = 'completed' THEN 'completed'::purchase_status
  WHEN status_temp = 'cancelled' THEN 'cancelled'::purchase_status
  ELSE 'pending_seller_approval'::purchase_status
END;

-- Step 7: Drop the temporary column
ALTER TABLE public.purchases DROP COLUMN status_temp;
