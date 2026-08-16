-- Migration: backfill swap_proposal_items for proposals that only have legacy single-item columns
-- This fixes proposals created before multi-item support was added

INSERT INTO public.swap_proposal_items (proposal_id, listing_id, side)
SELECT sp.id, sp.offered_item_id, 'offered'
FROM public.swap_proposals sp
WHERE sp.offered_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.swap_proposal_items spi
    WHERE spi.proposal_id = sp.id AND spi.side = 'offered'
  );

INSERT INTO public.swap_proposal_items (proposal_id, listing_id, side)
SELECT sp.id, sp.wanted_item_id, 'wanted'
FROM public.swap_proposals sp
WHERE sp.wanted_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.swap_proposal_items spi
    WHERE spi.proposal_id = sp.id AND spi.side = 'wanted'
  );
