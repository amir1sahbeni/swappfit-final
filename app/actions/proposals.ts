'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect, RedirectType } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// SEND PROPOSAL
// Returns { success, proposalId?, error? } — never throws (so client can show inline errors)
// ─────────────────────────────────────────────
export async function sendProposal(data: {
  offeredItemIds: string[]
  wantedItemIds: string[]
  receiverId: string
  note: string
}): Promise<{ success: boolean; proposalId?: string; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  if (!data.offeredItemIds.length || !data.wantedItemIds.length) {
    return { success: false, error: 'Select at least one item on each side.' }
  }
  if (data.offeredItemIds.length > 5 || data.wantedItemIds.length > 5) {
    return { success: false, error: 'Maximum 5 items allowed per side.' }
  }

  // ── Guard 1: same proposer already has this exact combo active? Not needed.
  // We use the new rule: If current user already has a pending OR accepted proposal where ANY of the wanted items match items they are trying to get → block
  const { data: duplicateWanted } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id, swap_proposals!inner(proposer_id, status)')
    .in('listing_id', data.wantedItemIds)
    .eq('swap_proposals.proposer_id', user.id)
    .in('swap_proposals.status', ['pending', 'accepted'])
    .limit(1)

  if (duplicateWanted && duplicateWanted.length > 0) {
    return { success: false, error: 'You already have a pending swap for one of these items. Wait for the seller to respond.' }
  }

  // ── Guard 2: offered item already locked in another proposal ──
  const { data: lockedOffered } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id, swap_proposals!inner(status)')
    .in('listing_id', data.offeredItemIds)
    .in('swap_proposals.status', ['pending', 'accepted'])
    .limit(1)

  if (lockedOffered && lockedOffered.length > 0) {
    return { success: false, error: 'One of your offered items is already in a pending swap.' }
  }

  // ── Guard 3: same buyer already has pending purchase for ANY wanted item ──
  const { data: purchaseConflict } = await supabase
    .from('purchases')
    .select('id, purchase_items!inner(item_id)')
    .eq('buyer_id', user.id)
    .in('status', ['pending_seller_approval', 'accepted'])
    .in('purchase_items.item_id', data.wantedItemIds)
    .limit(1)

  if (purchaseConflict && purchaseConflict.length > 0) {
    return { success: false, error: 'You have a pending purchase for one of these items.' }
  }

  // ── Guard 4: fetch item names for notifications ──
  const { data: wantedListing } = await supabase
    .from('listings')
    .select('name')
    .eq('id', data.wantedItemIds[0])
    .single()

  const { data: offeredListing } = await supabase
    .from('listings')
    .select('name')
    .eq('id', data.offeredItemIds[0])
    .single()

  // ── Create proposal — listing stays 'active'; no status change on proposal creation ──
  const { data: proposal, error: propErr } = await supabase
    .from('swap_proposals')
    .insert({
      proposer_id: user.id,
      receiver_id: data.receiverId,
      offered_item_id: data.offeredItemIds[0], // for legacy compat
      wanted_item_id: data.wantedItemIds[0], // for legacy compat
      note: data.note,
      status: 'pending',
    })
    .select('id')
    .single()

  if (propErr || !proposal) {
    return { success: false, error: 'FAILED_TO_CREATE_PROPOSAL' }
  }

  // ── Insert multi-items ──
  const proposalItems = [
    ...data.offeredItemIds.map(id => ({ proposal_id: proposal.id, listing_id: id, side: 'offered' })),
    ...data.wantedItemIds.map(id => ({ proposal_id: proposal.id, listing_id: id, side: 'wanted' }))
  ]
  await supabase.from('swap_proposal_items').insert(proposalItems)

  // ── Find or create conversation ──
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_a.eq.${user.id},participant_b.eq.${data.receiverId}),and(participant_a.eq.${data.receiverId},participant_b.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle()

  if (!existing?.id) {
    await supabase
      .from('conversations')
      .insert({
        participant_a: user.id,
        participant_b: data.receiverId,
        listing_id: data.wantedItemIds[0],
        proposal_id: proposal.id,
        last_message: 'Swap proposed',
        last_message_at: new Date().toISOString(),
      })
  }

  // ── Notifications ──
  await supabase.from('notifications').insert([
    {
      user_id: data.receiverId,
      type: 'swap_proposal',
      actor_id: user.id,
      entity_id: proposal.id,
      entity_status: 'pending',
      text: JSON.stringify({ wantedItemName: wantedListing?.name || 'Item', offeredItemName: offeredListing?.name || 'Item' }),
      read: false,
    },
    {
      user_id: user.id,
      type: 'swap_proposal',
      entity_id: proposal.id,
      entity_status: 'pending',
      text: JSON.stringify({ wantedItemName: wantedListing?.name || 'Item', offeredItemName: offeredListing?.name || 'Item', isProposer: true }),
      read: false,
    },
  ])

  return { success: true, proposalId: proposal.id }
}

// ─────────────────────────────────────────────
// UPDATE PROPOSAL STATUS (receiver: accept / decline; proposer: mark completed)
// ─────────────────────────────────────────────
export async function updateProposalStatus(
  proposalId: string,
  status: 'accepted' | 'declined' | 'completed'
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: proposal, error: fetchErr } = await supabase
    .from('swap_proposals')
    .select('*, offered_item:listings!offered_item_id(name), wanted_item:listings!wanted_item_id(name), items:swap_proposal_items(listing_id)')
    .eq('id', proposalId)
    .single()

  if (fetchErr || !proposal) throw new Error('PROPOSAL_NOT_FOUND')

  if (proposal.proposer_id !== user.id && proposal.receiver_id !== user.id) {
    throw new Error('UNAUTHORIZED')
  }
  
  const allItemIds = proposal.items ? proposal.items.map((i: any) => i.listing_id) : [proposal.offered_item_id, proposal.wanted_item_id]

  if (status === 'accepted') {
    // Update proposal
    const { error } = await supabase
      .from('swap_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', proposalId)

    if (error) throw new Error('FAILED_TO_ACCEPT')

    // Mark both items as 'swapped'
    await supabase
      .from('listings')
      .update({ status: 'swapped', updated_at: new Date().toISOString() })
      .in('id', allItemIds)

    // ── Auto-decline all other pending proposals involving ANY item ──
    const { data: conflicting } = await supabase
      .from('swap_proposal_items')
      .select('proposal_id, swap_proposals!inner(status, proposer_id)')
      .neq('proposal_id', proposalId)
      .eq('swap_proposals.status', 'pending')
      .in('listing_id', allItemIds)

    if (conflicting && conflicting.length > 0) {
      const conflictIds = [...new Set(conflicting.map(p => p.proposal_id))]
      await supabase
        .from('swap_proposals')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .in('id', conflictIds)

      const swapDeclineNotifs = conflicting.map(p => ({
        // @ts-ignore
        user_id: p.swap_proposals.proposer_id,
        type: 'swap_declined',
        text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', reason: 'unavailable' }),
        read: false,
      }))
      await supabase.from('notifications').insert(swapDeclineNotifs)
    }

    // ── Auto-decline all pending purchases for ANY item ──
    const { data: conflictingPurchases } = await supabase
      .from('purchase_items')
      .select('purchase_id, purchases!inner(id, buyer_id, status)')
      .in('item_id', allItemIds)
      .eq('purchases.status', 'pending_seller_approval')

    if (conflictingPurchases && conflictingPurchases.length > 0) {
      const purchaseIds = conflictingPurchases.map((pi: any) => pi.purchase_id)
      await supabase
        .from('purchases')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', purchaseIds)

      const purchaseDeclineNotifs = conflictingPurchases.map((pi: any) => ({
        user_id: pi.purchases.buyer_id,
        type: 'purchase_rejected',
        entity_id: pi.purchase_id,
        entity_status: 'cancelled',
        text: JSON.stringify({ itemName: proposal.wanted_item?.name || proposal.offered_item?.name || 'Item', reason: 'swapped' }),
        read: false,
      }))
      await supabase.from('notifications').insert(purchaseDeclineNotifs)
    }

    // Notify proposer of acceptance
    await supabase.from('notifications').insert([
      {
        user_id: proposal.proposer_id,
        type: 'swap_accepted',
        actor_id: proposal.receiver_id,
        entity_id: proposalId,
        entity_status: 'accepted',
        text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item' }),
        read: false,
      },
      {
        user_id: proposal.receiver_id,
        type: 'swap_accepted',
        actor_id: proposal.proposer_id,
        entity_id: proposalId,
        entity_status: 'accepted',
        text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', isReceiver: true }),
        read: false,
      },
    ])

  } else if (status === 'declined') {
    const { error } = await supabase
      .from('swap_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', proposalId)

    if (error) throw new Error('FAILED_TO_DECLINE')

    await supabase.from('notifications').insert({
      user_id: proposal.proposer_id,
      type: 'swap_declined',
      actor_id: proposal.receiver_id,
      entity_id: proposalId,
      entity_status: 'declined',
      text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item' }),
      read: false,
    })

  } else if (status === 'completed') {
    // Two-sided confirmation — cannot be triggered once already completed
    if (proposal.status === 'completed') return

    const isProposer = user.id === proposal.proposer_id
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (isProposer) {
      updateData.proposer_confirmed = true
    } else {
      updateData.receiver_confirmed = true
    }

    const newProposerConfirmed = isProposer ? true : proposal.proposer_confirmed
    const newReceiverConfirmed = !isProposer ? true : proposal.receiver_confirmed

    if (newProposerConfirmed && newReceiverConfirmed) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()

      await supabase.rpc('increment_swap_count', { p_user_id: proposal.proposer_id })
      await supabase.rpc('increment_swap_count', { p_user_id: proposal.receiver_id })

      // Ensure both items are marked 'swapped' when completed
      await supabase
        .from('listings')
        .update({ status: 'swapped', updated_at: new Date().toISOString() })
        .in('id', allItemIds)

      await supabase.from('notifications').insert([
        {
          user_id: proposal.proposer_id,
          type: 'swap_completed',
          actor_id: proposal.receiver_id,
          entity_id: proposalId,
          entity_status: 'completed',
          text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', isProposer: true }),
          read: false,
        },
        {
          user_id: proposal.receiver_id,
          type: 'swap_completed',
          actor_id: proposal.proposer_id,
          entity_id: proposalId,
          entity_status: 'completed',
          text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', isReceiver: true }),
          read: false,
        },
      ])
    } else {
      const otherUserId = isProposer ? proposal.receiver_id : proposal.proposer_id
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'swap_completed',
        actor_id: user.id,
        entity_id: proposalId,
        entity_status: 'accepted',
        text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', waitingForOther: true }),
        read: false,
      })
    }

    const { error } = await supabase
      .from('swap_proposals')
      .update(updateData)
      .eq('id', proposalId)

    if (error) throw new Error('FAILED_TO_COMPLETE')
  }

  revalidatePath(`/exchange/${proposalId}`)
  revalidatePath('/swaps')
}

// ─────────────────────────────────────────────
// CANCEL PROPOSAL (proposer only; allowed until status = 'completed')
// ─────────────────────────────────────────────
export async function cancelProposal(
  proposalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: proposal, error: fetchErr } = await supabase
    .from('swap_proposals')
    .select('*, offered_item:listings!offered_item_id(name), wanted_item:listings!wanted_item_id(name), items:swap_proposal_items(listing_id)')
    .eq('id', proposalId)
    .single()

  if (fetchErr || !proposal) return { success: false, error: 'PROPOSAL_NOT_FOUND' }
  if (proposal.proposer_id !== user.id) return { success: false, error: 'UNAUTHORIZED_PROPOSER_ONLY' }
  if (proposal.status === 'completed') return { success: false, error: 'CANNOT_CANCEL_COMPLETED' }
  if (proposal.status === 'cancelled' || proposal.status === 'declined') {
    return { success: false, error: 'ALREADY_CLOSED' }
  }

  const wasAccepted = proposal.status === 'accepted'

  const { error } = await supabase
    .from('swap_proposals')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)

  if (error) return { success: false, error: 'FAILED_TO_CANCEL' }

  // If swap was accepted, revert all listings to 'active'
  if (wasAccepted) {
    const allItemIds = proposal.items ? proposal.items.map((i: any) => i.listing_id) : [proposal.offered_item_id, proposal.wanted_item_id]
    await supabase
      .from('listings')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', allItemIds)
  }

  // Notify receiver
  await supabase.from('notifications').insert({
    user_id: proposal.receiver_id,
    type: 'swap_cancelled',
    actor_id: user.id,
    entity_id: proposalId,
    entity_status: 'cancelled',
    text: JSON.stringify({ wantedItemName: proposal.wanted_item?.name || 'Item', offeredItemName: proposal.offered_item?.name || 'Item', wasAccepted }),
    read: false,
  })

  revalidatePath(`/exchange/${proposalId}`)
  revalidatePath('/swaps')
  revalidatePath('/')

  return { success: true }
}
