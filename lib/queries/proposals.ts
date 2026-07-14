import { createServerClient } from '@/lib/supabase/server'
import type { SwapProposal } from '@/lib/types'

export async function getProposalById(id: string): Promise<SwapProposal | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('swap_proposals')
    .select(`
      id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, message, viewed, completed_at, created_at, updated_at,
      offered_item:listings!offered_item_id(id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng),
      wanted_item:listings!wanted_item_id(id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng),
      proposer:profiles!proposer_id(id, name, handle, avatar_url, is_premium, rating, review_count),
      receiver:profiles!receiver_id(id, name, handle, avatar_url, is_premium, rating, review_count)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as SwapProposal
}

export async function getUserProposals(userId: string): Promise<SwapProposal[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('swap_proposals')
    .select(`
      id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, message, viewed, completed_at, created_at, updated_at,
      offered_item:listings!offered_item_id(id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng),
      wanted_item:listings!wanted_item_id(id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, listing_lat, listing_lng),
      proposer:profiles!proposer_id(id, name, handle, avatar_url, is_premium, rating, review_count),
      receiver:profiles!receiver_id(id, name, handle, avatar_url, is_premium, rating, review_count)
    `)
    .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as SwapProposal[]
}
