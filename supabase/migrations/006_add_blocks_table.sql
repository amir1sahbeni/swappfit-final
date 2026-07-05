-- ============================================================
-- SwappFit — Add Blocks Table
-- ============================================================

-- Blocks table for user blocking functionality
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS blocks_blocker_idx ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON public.blocks(blocked_id);

-- Row Level Security
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
CREATE POLICY "blocks_select_own"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can only insert their own blocks
CREATE POLICY "blocks_insert_own"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can only delete their own blocks
CREATE POLICY "blocks_delete_own"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);
