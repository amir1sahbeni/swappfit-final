import { createServerClient } from '@/lib/supabase/server'
import type { SwapProposal } from '@/lib/types'

export async function getProposalById(id: string): Promise<SwapProposal | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('swap_proposals')
    .select(`
      *,
      offered_item:listings!offered_item_id(*),
      wanted_item:listings!wanted_item_id(*),
      proposer:profiles!proposer_id(*),
      receiver:profiles!receiver_id(*)
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
      *,
      offered_item:listings!offered_item_id(*),
      wanted_item:listings!wanted_item_id(*),
      proposer:profiles!proposer_id(*),
      receiver:profiles!receiver_id(*)
    `)
    .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as SwapProposal[]
}
