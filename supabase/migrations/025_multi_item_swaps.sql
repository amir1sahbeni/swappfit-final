-- Fix missing columns on swap_proposals from previous migrations
ALTER TABLE public.swap_proposals 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Make old 1-to-1 item columns nullable (we now use swap_proposal_items)
ALTER TABLE public.swap_proposals 
ALTER COLUMN offered_item_id DROP NOT NULL,
ALTER COLUMN wanted_item_id DROP NOT NULL;

-- Create the new multi-item junction table
CREATE TABLE IF NOT EXISTS public.swap_proposal_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.swap_proposals(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  side text CHECK (side IN ('offered', 'wanted')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.swap_proposal_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can view proposal items"
  ON public.swap_proposal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_proposals sp
      WHERE sp.id = proposal_id
      AND (sp.proposer_id = auth.uid() OR sp.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Proposer can insert proposal items"
  ON public.swap_proposal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swap_proposals sp
      WHERE sp.id = proposal_id
      AND sp.proposer_id = auth.uid()
    )
  );
