'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cancelProposal } from './proposals'
import { cancelPurchase } from './purchases'
import { revalidatePath } from 'next/cache'

// Removes a swap proposal from the user's history.
// If still active (pending/accepted), cancels it first (reverts listings, notifies other party).
export async function removeSwapProposal(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: proposal } = await supabase
    .from('swap_proposals')
    .select('status, proposer_id')
    .eq('id', id)
    .maybeSingle()

  if (!proposal) return { success: true } // Already gone

  // If active and this user is the proposer, cancel properly first
  if (['pending', 'accepted'].includes(proposal.status) && proposal.proposer_id === user.id) {
    await cancelProposal(id)
    return { success: true }
  }

  // For terminal states or if receiver, just remove from view (hard delete)
  await supabase
    .from('swap_proposals')
    .delete()
    .eq('id', id)
    .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)

  revalidatePath('/swaps')
  return { success: true }
}

// Removes a purchase from the user's history.
// If still active, cancels it first.
export async function removePurchaseFromHistory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: purchase } = await supabase
    .from('purchases')
    .select('status, buyer_id')
    .eq('id', id)
    .maybeSingle()

  if (!purchase) return { success: true }

  // If buyer and active, cancel properly
  if (['pending_seller_approval', 'accepted'].includes(purchase.status) && purchase.buyer_id === user.id) {
    return cancelPurchase(id)
  }

  // Terminal state — just delete the row
  await supabase
    .from('purchases')
    .delete()
    .eq('id', id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

  revalidatePath('/swaps')
  return { success: true }
}

// Legacy exports kept for backwards compatibility during transition
export const deleteSwapProposal = removeSwapProposal
export const deletePurchase = removePurchaseFromHistory

// Mark swaps as viewed by updating swaps_viewed_at in profiles
export async function markSwapsAsViewed() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ swaps_viewed_at: new Date().toISOString() })
    .eq('id', user.id)
}
