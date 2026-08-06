'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect, RedirectType } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from '@/lib/webpush'

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
  const { data: duplicateWantedItems } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id')
    .in('listing_id', data.wantedItemIds)

  let duplicateWanted: any[] = []
  if (duplicateWantedItems && duplicateWantedItems.length > 0) {
    const proposalIds = [...new Set(duplicateWantedItems.map(p => p.proposal_id))]
    const { data: proposals } = await supabase
      .from('swap_proposals')
      .select('id, proposer_id, status')
      .in('id', proposalIds)
      .eq('proposer_id', user.id)
      .in('status', ['pending', 'accepted'])
    duplicateWanted = proposals || []
  }

  if (duplicateWanted.length > 0) {
    return { success: false, error: 'You already have a pending swap for one of these items. Wait for the seller to respond.' }
  }

  // ── Guard 2: offered item already locked in another proposal ──
  const { data: lockedOfferedItems } = await supabase
    .from('swap_proposal_items')
    .select('proposal_id')
    .in('listing_id', data.offeredItemIds)

  let lockedOffered: any[] = []
  if (lockedOfferedItems && lockedOfferedItems.length > 0) {
    const proposalIds = [...new Set(lockedOfferedItems.map(p => p.proposal_id))]
    const { data: proposals } = await supabase
      .from('swap_proposals')
      .select('id, status')
      .in('id', proposalIds)
      .in('status', ['pending', 'accepted'])
    lockedOffered = proposals || []
  }

  if (lockedOffered.length > 0) {
    return { success: false, error: 'One of your offered items is already in a pending swap.' }
  }

  // ── Guard 3: same buyer already has pending purchase for ANY wanted item ──
  const { data: purchaseItems } = await supabase
    .from('purchase_items')
    .select('purchase_id')
    .in('item_id', data.wantedItemIds)

  let purchaseConflict: any[] = []
  if (purchaseItems && purchaseItems.length > 0) {
    const purchaseIds = [...new Set(purchaseItems.map(pi => pi.purchase_id))]
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, buyer_id, status')
      .in('id', purchaseIds)
      .eq('buyer_id', user.id)
      .in('status', ['pending_seller_approval', 'accepted'])
    purchaseConflict = purchases || []
  }

  if (purchaseConflict.length > 0) {
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

  // ── Notifications ──
  // Fetch proposer profile for push title
  const { data: proposerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const proposerName = proposerProfile?.name || 'Someone'

  await supabase.from('notifications').insert([
    {
      user_id: data.receiverId,
      type: 'swap_proposal',
      actor_id: user.id,
      entity_id: proposal.id,
      text: JSON.stringify({ wantedItemName: wantedListing?.name || 'Item', offeredItemName: offeredListing?.name || 'Item' }),
      read: false,
    },
    {
      user_id: user.id,
      type: 'swap_proposal',
      entity_id: proposal.id,
      text: JSON.stringify({ wantedItemName: wantedListing?.name || 'Item', offeredItemName: offeredListing?.name || 'Item', isProposer: true }),
      read: false,
    },
  ])

  // Push to receiver
  await sendPushToUser(supabase, data.receiverId, proposerName, `${proposerName} wants to swap with you`, `/exchange/${proposal.id}`)

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
    .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, proposer_confirmed, receiver_confirmed')
    .eq('id', proposalId)
    .single()

  if (fetchErr || !proposal) throw new Error('PROPOSAL_NOT_FOUND')

  if (proposal.proposer_id !== user.id && proposal.receiver_id !== user.id) {
    throw new Error('UNAUTHORIZED')
  }

  // Fetch proposal items
  const { data: proposalItems } = await supabase
    .from('swap_proposal_items')
    .select('listing_id')
    .eq('proposal_id', proposalId)

  const allItemIds = proposalItems && proposalItems.length > 0 ? proposalItems.map((i: any) => i.listing_id) : [proposal.offered_item_id, proposal.wanted_item_id].filter(Boolean)

  // Fetch listing names for notifications
  const listingIds = [...new Set(allItemIds)]
  let wantedItemName = 'Item'
  let offeredItemName = 'Item'
  if (proposal.wanted_item_id) {
    const { data: wantedListing } = await supabase.from('listings').select('name').eq('id', proposal.wanted_item_id).single()
    wantedItemName = wantedListing?.name || 'Item'
  }
  if (proposal.offered_item_id) {
    const { data: offeredListing } = await supabase.from('listings').select('name').eq('id', proposal.offered_item_id).single()
    offeredItemName = offeredListing?.name || 'Item'
  }

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
    const { data: conflictingItems } = await supabase
      .from('swap_proposal_items')
      .select('proposal_id')
      .neq('proposal_id', proposalId)
      .in('listing_id', allItemIds)

    let conflicting: any[] = []
    if (conflictingItems && conflictingItems.length > 0) {
      const conflictIds = [...new Set(conflictingItems.map(p => p.proposal_id))]
      const { data: conflictingProposals } = await supabase
        .from('swap_proposals')
        .select('id, proposer_id, status')
        .in('id', conflictIds)
        .eq('status', 'pending')
      conflicting = conflictingProposals || []
    }

    if (conflicting.length > 0) {
      const conflictIds = conflicting.map(p => p.id)
      await supabase
        .from('swap_proposals')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .in('id', conflictIds)

      const swapDeclineNotifs = conflicting.map(p => ({
        user_id: p.proposer_id,
        type: 'swap_declined',
        text: JSON.stringify({ wantedItemName, offeredItemName, reason: 'unavailable' }),
        read: false,
      }))
      await supabase.from('notifications').insert(swapDeclineNotifs)
    }

    // ── Auto-decline all pending purchases for ANY item ──
    const { data: conflictingPurchaseItems } = await supabase
      .from('purchase_items')
      .select('purchase_id')
      .in('item_id', allItemIds)

    let conflictingPurchases: any[] = []
    if (conflictingPurchaseItems && conflictingPurchaseItems.length > 0) {
      const purchaseIds = [...new Set(conflictingPurchaseItems.map(pi => pi.purchase_id))]
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, buyer_id, status')
        .in('id', purchaseIds)
        .eq('status', 'pending_seller_approval')
      conflictingPurchases = purchases || []
    }

    if (conflictingPurchases.length > 0) {
      const purchaseIds = conflictingPurchases.map((pi: any) => pi.id)
      await supabase
        .from('purchases')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', purchaseIds)

      const purchaseDeclineNotifs = conflictingPurchases.map((pi: any) => ({
        user_id: pi.buyer_id,
        type: 'purchase_rejected',
        entity_id: pi.id,
        text: JSON.stringify({ itemName: wantedItemName || offeredItemName || 'Item', reason: 'swapped' }),
        read: false,
      }))
      await supabase.from('notifications').insert(purchaseDeclineNotifs)
    }

    // Notify proposer of acceptance
    const { data: receiverProfile } = await supabase.from('profiles').select('name').eq('id', proposal.receiver_id).single()
    const receiverName = receiverProfile?.name || 'Someone'

    await supabase.from('notifications').insert([
      {
        user_id: proposal.proposer_id,
        type: 'swap_accepted',
        actor_id: proposal.receiver_id,
        entity_id: proposalId,
        text: JSON.stringify({ wantedItemName, offeredItemName }),
        read: false,
      },
      {
        user_id: proposal.receiver_id,
        type: 'swap_accepted',
        actor_id: proposal.proposer_id,
        entity_id: proposalId,
        text: JSON.stringify({ wantedItemName, offeredItemName, isReceiver: true }),
        read: false,
      },
    ])

    // Push to proposer
    await sendPushToUser(supabase, proposal.proposer_id, receiverName, `${receiverName} accepted your swap proposal`, `/exchange/${proposalId}`)

  } else if (status === 'declined') {
    const { error } = await supabase
      .from('swap_proposals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', proposalId)

    if (error) throw new Error('FAILED_TO_DECLINE')

    // Notify proposer of decline
    const { data: receiverProfileD } = await supabase.from('profiles').select('name').eq('id', proposal.receiver_id).single()
    const receiverNameD = receiverProfileD?.name || 'Someone'

    await supabase.from('notifications').insert({
      user_id: proposal.proposer_id,
      type: 'swap_declined',
      actor_id: proposal.receiver_id,
      entity_id: proposalId,
      text: JSON.stringify({ wantedItemName, offeredItemName }),
      read: false,
    })

    await sendPushToUser(supabase, proposal.proposer_id, receiverNameD, `${receiverNameD} declined your swap proposal`, `/swaps`)

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
          text: JSON.stringify({ wantedItemName, offeredItemName, isProposer: true }),
          read: false,
        },
        {
          user_id: proposal.receiver_id,
          type: 'swap_completed',
          actor_id: proposal.proposer_id,
          entity_id: proposalId,
          text: JSON.stringify({ wantedItemName, offeredItemName, isReceiver: true }),
          read: false,
        },
      ])
    } else {
      const otherUserId = isProposer ? proposal.receiver_id : proposal.proposer_id
      const { data: confirmProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const confirmName = confirmProfile?.name || 'Someone'

      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'swap_completed',
        actor_id: user.id,
        entity_id: proposalId,
        text: JSON.stringify({ wantedItemName, offeredItemName, waitingForOther: true }),
        read: false,
      })

      await sendPushToUser(supabase, otherUserId, confirmName, `${confirmName} confirmed receipt. Waiting for your confirmation.`, `/exchange/${proposalId}`)
    }

    const { error } = await supabase
      .from('swap_proposals')
      .update(updateData)
      .eq('id', proposalId)

    if (error) throw new Error('FAILED_TO_COMPLETE')
  }

  revalidatePath(`/exchange/${proposalId}`)
  revalidatePath('/swaps')
  revalidatePath('/')
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
    .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status')
    .eq('id', proposalId)
    .single()

  if (fetchErr || !proposal) return { success: false, error: 'PROPOSAL_NOT_FOUND' }
  if (proposal.proposer_id !== user.id) return { success: false, error: 'UNAUTHORIZED_PROPOSER_ONLY' }
  if (proposal.status === 'completed') return { success: false, error: 'CANNOT_CANCEL_COMPLETED' }
  if (proposal.status === 'cancelled' || proposal.status === 'declined') {
    return { success: false, error: 'ALREADY_CLOSED' }
  }

  const wasAccepted = proposal.status === 'accepted'

  // Fetch proposal items for reverting listings
  const { data: proposalItems } = await supabase
    .from('swap_proposal_items')
    .select('listing_id')
    .eq('proposal_id', proposalId)

  const allItemIds = proposalItems && proposalItems.length > 0 ? proposalItems.map((i: any) => i.listing_id) : [proposal.offered_item_id, proposal.wanted_item_id].filter(Boolean)

  // Fetch listing names for notifications
  let wantedItemName = 'Item'
  let offeredItemName = 'Item'
  if (proposal.wanted_item_id) {
    const { data: wantedListing } = await supabase.from('listings').select('name').eq('id', proposal.wanted_item_id).single()
    wantedItemName = wantedListing?.name || 'Item'
  }
  if (proposal.offered_item_id) {
    const { data: offeredListing } = await supabase.from('listings').select('name').eq('id', proposal.offered_item_id).single()
    offeredItemName = offeredListing?.name || 'Item'
  }

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
    await supabase
      .from('listings')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', allItemIds)
  }

  // Notify receiver of cancellation
  const { data: proposerProfile2 } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const proposerName2 = proposerProfile2?.name || 'Someone'

  await supabase.from('notifications').insert({
    user_id: proposal.receiver_id,
    type: 'swap_cancelled',
    actor_id: user.id,
    entity_id: proposalId,
    text: JSON.stringify({ wantedItemName, offeredItemName, wasAccepted }),
    read: false,
  })

  await sendPushToUser(supabase, proposal.receiver_id, proposerName2, `${proposerName2} cancelled the swap`, `/swaps`)

  revalidatePath(`/exchange/${proposalId}`)
  revalidatePath('/swaps')
  revalidatePath('/')

  return { success: true }
}
