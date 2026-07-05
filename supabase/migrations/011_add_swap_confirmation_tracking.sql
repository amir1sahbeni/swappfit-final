-- Add columns for two-sided swap confirmation tracking
ALTER TABLE public.swap_proposals 
ADD COLUMN IF NOT EXISTS proposer_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS receiver_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS proposals_proposer_confirmed_idx ON public.swap_proposals(proposer_confirmed);
CREATE INDEX IF NOT EXISTS proposals_receiver_confirmed_idx ON public.swap_proposals(receiver_confirmed);
