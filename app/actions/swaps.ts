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
    .select('status, proposer_id, hidden_for')
    .eq('id', id)
    .maybeSingle()

  if (!proposal) return { success: true } // Already gone

  // If active and this user is the proposer, cancel properly first
  if (['pending', 'accepted'].includes(proposal.status) && proposal.proposer_id === user.id) {
    await cancelProposal(id)
    return { success: true }
  }

  // For terminal states or if receiver, hide from view by updating hidden_for
  const currentHidden = proposal.hidden_for || []
  await supabase
    .from('swap_proposals')
    .update({ hidden_for: Array.from(new Set([...currentHidden, user.id])) })
    .eq('id', id)

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
    .select('status, buyer_id, hidden_for')
    .eq('id', id)
    .maybeSingle()

  if (!purchase) return { success: true }

  // If buyer and active, cancel properly
  if (['pending_seller_approval', 'accepted'].includes(purchase.status) && purchase.buyer_id === user.id) {
    return cancelPurchase(id)
  }

  // Terminal state — hide it
  const currentHidden = purchase.hidden_for || []
  await supabase
    .from('purchases')
    .update({ hidden_for: Array.from(new Set([...currentHidden, user.id])) })
    .eq('id', id)

  revalidatePath('/swaps')
  return { success: true }
}

export async function hideAllSwapsFromHistory(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Hide completed, cancelled, declined proposals
  const { data: proposals } = await supabase
    .from('swap_proposals')
    .select('id, hidden_for')
    .in('status', ['completed', 'cancelled', 'declined'])
    .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (proposals && proposals.length > 0) {
    for (const p of proposals) {
      if (!p.hidden_for?.includes(user.id)) {
        await supabase
          .from('swap_proposals')
          .update({ hidden_for: [...(p.hidden_for || []), user.id] })
          .eq('id', p.id)
      }
    }
  }

  // Hide completed, cancelled, declined purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, hidden_for')
    .in('status', ['completed', 'cancelled', 'declined'])
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

  if (purchases && purchases.length > 0) {
    for (const p of purchases) {
      if (!p.hidden_for?.includes(user.id)) {
        await supabase
          .from('purchases')
          .update({ hidden_for: [...(p.hidden_for || []), user.id] })
          .eq('id', p.id)
      }
    }
  }

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

export async function markSwapAsRead(id: string, type: 'swap' | 'purchase'): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  if (type === 'swap') {
    const { data: swap } = await supabase
      .from('swap_proposals')
      .select('proposer_id, receiver_id')
      .eq('id', id)
      .maybeSingle()

    if (!swap) return { success: false, error: 'Swap not found' }

    if (swap.proposer_id === user.id) {
      await supabase.from('swap_proposals').update({ proposer_read: true }).eq('id', id)
    } else if (swap.receiver_id === user.id) {
      await supabase.from('swap_proposals').update({ receiver_read: true }).eq('id', id)
    }
  } else {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('buyer_id, seller_id')
      .eq('id', id)
      .maybeSingle()

    if (!purchase) return { success: false, error: 'Purchase not found' }

    if (purchase.buyer_id === user.id) {
      await supabase.from('purchases').update({ buyer_read: true }).eq('id', id)
    } else if (purchase.seller_id === user.id) {
      await supabase.from('purchases').update({ seller_read: true }).eq('id', id)
    }
  }

  return { success: true }
}

export async function markAllSwapsAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Update proposals where user is proposer
  await supabase
    .from('swap_proposals')
    .update({ proposer_read: true })
    .eq('proposer_id', user.id)
    .eq('proposer_read', false)

  // Update proposals where user is receiver
  await supabase
    .from('swap_proposals')
    .update({ receiver_read: true })
    .eq('receiver_id', user.id)
    .eq('receiver_read', false)

  // Update purchases where user is buyer
  await supabase
    .from('purchases')
    .update({ buyer_read: true })
    .eq('buyer_id', user.id)
    .eq('buyer_read', false)

  // Update purchases where user is seller
  await supabase
    .from('purchases')
    .update({ seller_read: true })
    .eq('seller_id', user.id)
    .eq('seller_read', false)

  revalidatePath('/swaps')
  return { success: true }
}
