CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_proposals_proposer ON public.swap_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_swap_proposals_receiver ON public.swap_proposals(receiver_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON public.purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
