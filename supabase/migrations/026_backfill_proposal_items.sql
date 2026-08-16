-- Fix 1: Grant proper permissions to authenticated role on swap_proposal_items
-- (RLS policies alone don't grant table access — need explicit GRANTs)
GRANT SELECT, INSERT, DELETE ON public.swap_proposal_items TO authenticated;
GRANT SELECT ON public.swap_proposal_items TO anon;

-- Fix 2: Backfill swap_proposal_items from legacy columns for old proposals
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
