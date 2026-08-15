-- Reset all existing swap_proposal read flags to false (unread)
-- so users can actually see and use the mark-as-read feature
UPDATE public.swap_proposals
SET proposer_read = false,
    receiver_read = false
WHERE proposer_read = true OR receiver_read = true;

-- Reset all existing purchase read flags to false (unread)
UPDATE public.purchases
SET buyer_read = false,
    seller_read = false
WHERE buyer_read = true OR seller_read = true;
