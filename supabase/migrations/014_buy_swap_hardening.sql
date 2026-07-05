-- ============================================================
-- SwappFit Migration 014 — Buy/Swap System Hardening
-- ============================================================

-- 1. Add tables to realtime publication so UI subscriptions work
ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;

-- 2. Add cancelled_at for audit trail on swap proposals
ALTER TABLE public.swap_proposals
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 3. Indexes to speed up cross-flow conflict queries
CREATE INDEX IF NOT EXISTS proposals_offered_item_status_idx
  ON public.swap_proposals(offered_item_id, status);

CREATE INDEX IF NOT EXISTS proposals_wanted_item_status_idx
  ON public.swap_proposals(wanted_item_id, status);

CREATE INDEX IF NOT EXISTS purchase_items_item_id_idx
  ON public.purchase_items(item_id);
