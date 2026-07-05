-- Add swaps_viewed_at to track when a user last viewed their swaps
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS swaps_viewed_at timestamptz DEFAULT '1970-01-01T00:00:00Z';

-- In case migration 011 failed to add completed_at to swap_proposals, try again here
ALTER TABLE public.swap_proposals
ADD COLUMN IF NOT EXISTS completed_at timestamptz;
