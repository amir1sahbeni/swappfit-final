'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from '@/lib/webpush'

// ─────────────────────────────────────────────
// CREATE PURCHASE
// Listing stays 'active' until seller accepts. Multiple buyers allowed simultaneously.
// Only same buyer is blocked from duplicate pending purchases.
// ─────────────────────────────────────────────
export async function createPurchase(listingId: string): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // 1. Fetch listing (must be active)
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, price, name')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (listingError || !listing) {
    return { success: false, error: 'ITEM_UNAVAILABLE' }
  }

  if (listing.seller_id === user.id) {
    return { success: false, error: 'CANNOT_BUY_OWN_ITEM' }
  }

  // 2. Guard: same buyer already has pending/accepted purchase for this item
  const { data: existingItems } = await supabase
    .from('purchase_items')
    .select('purchase_id')
    .eq('item_id', listingId)

  if (existingItems && existingItems.length > 0) {
    const existingPurchaseIds = existingItems.map((pi: any) => pi.purchase_id)
    const { data: myExisting } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .in('id', existingPurchaseIds)
      .in('status', ['pending_seller_approval', 'accepted'])
      .maybeSingle()

    if (myExisting) {
      return { success: false, error: 'PENDING_PURCHASE_EXISTS' }
    }
  }

  // 3. Guard: same buyer has pending/accepted swap proposal for this wanted item
  const { data: swapConflict } = await supabase
    .from('swap_proposals')
    .select('id')
    .eq('proposer_id', user.id)
    .eq('wanted_item_id', listingId)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (swapConflict) {
    return { success: false, error: 'PENDING_SWAP_EXISTS' }
  }

  // 4. Create purchase — do NOT change listing.status (stays 'active')
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      status: 'pending_seller_approval',
      total_price: listing.price
    })
    .select('id')
    .single()

  if (purchaseError || !purchase) {
    return { success: false, error: 'FAILED_TO_CREATE' }
  }

  // 5. Create purchase item
  await supabase
    .from('purchase_items')
    .insert({
      purchase_id: purchase.id,
      item_id: listingId,
      quantity: 1,
      price_at_purchase: listing.price
    })

  // 6. Notify seller
  const { data: buyerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const buyerName = buyerProfile?.name || 'Someone'

  try {
    await supabase.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'purchase_request',
      actor_id: user.id,
      entity_id: purchase.id,
      text: JSON.stringify({ itemName: listing.name }),
      read: false
    })
  } catch (notifErr) {
    console.error('Failed to send notification:', notifErr)
    // Don't fail the purchase if notification fails
  }

  await sendPushToUser(supabase, listing.seller_id, buyerName, `${buyerName} wants to buy your ${listing.name}`, `/purchase/${purchase.id}`)

  revalidatePath('/')
  return { success: true, purchaseId: purchase.id }
}

// ─────────────────────────────────────────────
// ACCEPT PURCHASE (seller)
// Marks listing 'sold', auto-declines all other pending transactions for this item.
// ─────────────────────────────────────────────
export async function acceptPurchase(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'UNAUTHORIZED' }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, purchase_items(item_id, item:listings(name))')
    .eq('id', purchaseId)
    .single()

  if (!purchase || purchase.seller_id !== user.id) {
    return { success: false, error: 'NOT_FOUND_OR_UNAUTHORIZED' }
  }

  if (purchase.status !== 'pending_seller_approval') {
    return { success: false, error: 'INVALID_STATE' }
  }

  // 1. Accept this purchase
  const { error: updateErr } = await supabase
    .from('purchases')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', purchaseId)

  if (updateErr) return { success: false, error: 'FAILED_TO_ACCEPT' }

  const itemId = purchase.purchase_items?.[0]?.item_id

  if (itemId) {
    // 2. Mark listing as 'sold'
    await supabase
      .from('listings')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', itemId)

    // 3. Auto-decline all OTHER pending purchases for this item
    const { data: otherPurchaseItems } = await supabase
      .from('purchase_items')
      .select('purchase_id')
      .eq('item_id', itemId)
      .neq('purchase_id', purchaseId)

    if (otherPurchaseItems && otherPurchaseItems.length > 0) {
      const otherIds = otherPurchaseItems.map((pi: any) => pi.purchase_id)
      const { data: pendingOthers } = await supabase
        .from('purchases')
        .select('id, buyer_id')
        .in('id', otherIds)
        .eq('status', 'pending_seller_approval')

      if (pendingOthers && pendingOthers.length > 0) {
        await supabase
          .from('purchases')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .in('id', pendingOthers.map((p: any) => p.id))

        await supabase.from('notifications').insert(
          pendingOthers.map((p: any) => ({
            user_id: p.buyer_id,
            type: 'purchase_rejected',
            entity_id: p.id,
            text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item' }),
            read: false,
          }))
        )
      }
    }

    // 4. Auto-decline pending swap proposals for this item
    const { data: pendingSwaps } = await supabase
      .from('swap_proposals')
      .select('id, proposer_id')
      .eq('wanted_item_id', itemId)
      .eq('status', 'pending')

    if (pendingSwaps && pendingSwaps.length > 0) {
      await supabase
        .from('swap_proposals')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .in('id', pendingSwaps.map((s: any) => s.id))

      await supabase.from('notifications').insert(
        pendingSwaps.map((s: any) => ({
          user_id: s.proposer_id,
          type: 'swap_declined',
          entity_id: s.id,
          text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item' }),
          read: false,
        }))
      )
    }
  }

  // 5. Notify buyer
  const { data: sellerAccProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const sellerAccName = sellerAccProfile?.name || 'Someone'

  await supabase.from('notifications').insert({
    user_id: purchase.buyer_id,
    type: 'purchase_accepted',
    actor_id: user.id,
    entity_id: purchaseId,
    text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item' }),
    read: false
  })

  await sendPushToUser(supabase, purchase.buyer_id, sellerAccName, `${sellerAccName} accepted your purchase offer`, `/purchase/${purchaseId}`)

  revalidatePath(`/purchase/${purchaseId}`)
  revalidatePath('/')
  return { success: true }
}

// ─────────────────────────────────────────────
// REJECT PURCHASE (seller declines)
// ─────────────────────────────────────────────
export async function rejectPurchase(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'UNAUTHORIZED' }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('seller_id, buyer_id, status, purchase_items(item:listings(name))')
    .eq('id', purchaseId)
    .single()

  if (!purchase || purchase.seller_id !== user.id) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  if (purchase.status !== 'pending_seller_approval') {
    return { success: false, error: 'INVALID_STATE' }
  }

  const { error } = await supabase
    .from('purchases')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', purchaseId)

  if (error) return { success: false, error: 'FAILED_TO_DECLINE' }

  // Listing stays active — other buyers still have pending purchases

  const { data: sellerRejProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const sellerRejName = sellerRejProfile?.name || 'Someone'

  await supabase.from('notifications').insert({
    user_id: purchase.buyer_id,
    type: 'purchase_rejected',
    actor_id: user.id,
    entity_id: purchaseId,
    text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item' }),
    read: false
  })

  await sendPushToUser(supabase, purchase.buyer_id, sellerRejName, `${sellerRejName} declined your purchase offer`, `/swaps`)

  revalidatePath(`/purchase/${purchaseId}`)
  return { success: true }
}

// ─────────────────────────────────────────────
// CANCEL PURCHASE (buyer — allowed until status = 'completed')
// ─────────────────────────────────────────────
export async function cancelPurchase(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'UNAUTHORIZED' }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, purchase_items(item_id, item:listings(name))')
    .eq('id', purchaseId)
    .single()

  if (!purchase || purchase.buyer_id !== user.id) {
    return { success: false, error: 'UNAUTHORIZED_BUYER_ONLY' }
  }

  if (purchase.status === 'completed') {
    return { success: false, error: 'CANNOT_CANCEL_COMPLETED' }
  }

  if (purchase.status === 'cancelled') {
    return { success: false, error: 'ALREADY_CANCELLED' }
  }

  const wasAccepted = purchase.status === 'accepted'

  const { error } = await supabase
    .from('purchases')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', purchaseId)

  if (error) return { success: false, error: 'FAILED_TO_CANCEL' }

  // If seller had accepted, revert listing to 'active'
  if (wasAccepted) {
    const itemId = purchase.purchase_items?.[0]?.item_id
    if (itemId) {
      await supabase
        .from('listings')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', itemId)
    }
  }

  // Notify seller
  const { data: buyerCancelProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const buyerCancelName = buyerCancelProfile?.name || 'Someone'

  await supabase.from('notifications').insert({
    user_id: purchase.seller_id,
    type: 'purchase_cancelled',
    actor_id: user.id,
    entity_id: purchaseId,
    text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item', wasAccepted }),
    read: false
  })

  await sendPushToUser(supabase, purchase.seller_id, buyerCancelName, `${buyerCancelName} cancelled the purchase`, `/purchase/${purchaseId}`)

  revalidatePath(`/purchase/${purchaseId}`)
  revalidatePath('/')
  return { success: true }
}

// ─────────────────────────────────────────────
// COMPLETE PURCHASE (buyer marks as received)
// ─────────────────────────────────────────────
export async function completePurchase(purchaseId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'UNAUTHORIZED' }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('*, purchase_items(item_id, item:listings(name))')
    .eq('id', purchaseId)
    .single()

  if (!purchase || purchase.buyer_id !== user.id) {
    return { success: false, error: 'UNAUTHORIZED_BUYER_ONLY' }
  }

  if (purchase.status !== 'accepted') {
    return { success: false, error: 'INVALID_STATE_FOR_COMPLETION' }
  }

  const { error } = await supabase
    .from('purchases')
    .update({
      status: 'completed',
      buyer_confirmed: true,
      seller_confirmed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', purchaseId)

  if (error) return { success: false, error: 'FAILED_TO_COMPLETE' }

  // Ensure listing stays 'sold'
  const itemId = purchase.purchase_items?.[0]?.item_id
  if (itemId) {
    await supabase
      .from('listings')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', itemId)
  }

  await supabase.rpc('increment_swap_count', { p_user_id: purchase.buyer_id })
  await supabase.rpc('increment_swap_count', { p_user_id: purchase.seller_id })

  await supabase.from('notifications').insert([
    {
      user_id: purchase.seller_id,
      type: 'purchase_completed',
      actor_id: user.id,
      entity_id: purchaseId,
      text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item', isSeller: true }),
      read: false
    },
    {
      user_id: purchase.buyer_id,
      type: 'purchase_completed',
      actor_id: purchase.seller_id,
      entity_id: purchaseId,
      text: JSON.stringify({ itemName: purchase.purchase_items?.[0]?.item?.name || 'Item', isSeller: false }),
      read: false
    }
  ])

  // Fetch buyer name for push
  const { data: buyerComplProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const buyerComplName = buyerComplProfile?.name || 'Someone'
  const itemNameStr = purchase.purchase_items?.[0]?.item?.name || 'item'

  await sendPushToUser(supabase, purchase.seller_id, buyerComplName, `${buyerComplName} received your ${itemNameStr}. Purchase complete!`, `/purchase/${purchaseId}`)

  revalidatePath(`/purchase/${purchaseId}`)
  revalidatePath('/')
  return { success: true }
}
