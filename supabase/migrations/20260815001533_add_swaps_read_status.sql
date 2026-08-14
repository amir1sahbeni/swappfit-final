-- Add read status columns to swap_proposals
ALTER TABLE swap_proposals
ADD COLUMN proposer_read BOOLEAN DEFAULT true,
ADD COLUMN receiver_read BOOLEAN DEFAULT true;

-- Update default constraints to false for new rows
ALTER TABLE swap_proposals
ALTER COLUMN proposer_read SET DEFAULT false,
ALTER COLUMN receiver_read SET DEFAULT false;

-- Add read status columns to purchases
ALTER TABLE purchases
ADD COLUMN buyer_read BOOLEAN DEFAULT true,
ADD COLUMN seller_read BOOLEAN DEFAULT true;

-- Update default constraints to false for new rows
ALTER TABLE purchases
ALTER COLUMN buyer_read SET DEFAULT false,
ALTER COLUMN seller_read SET DEFAULT false;
