import { notFound, redirect } from "next/navigation"
import { getListingById, getUserListings } from "@/lib/queries/listings"
import { getProfile } from "@/lib/queries/profiles"
import { listingToItem } from "@/lib/utils"
import { ProposeView } from "./propose-view"
import { createServerClient } from "@/lib/supabase/server"

export default async function ProposePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const wantedListing = await getListingById(id)
  if (!wantedListing) notFound()

  // Cannot propose on your own item
  if (wantedListing.seller_id === user.id) redirect(`/item/${id}`)

  // Must be active
  if (wantedListing.status !== 'active') redirect(`/item/${id}`)

  const wantedItem = listingToItem(wantedListing)
  const receiverProfile = await getProfile(wantedListing.seller_id)
  if (!receiverProfile) notFound()

  // Fetch only the user's active listings to offer (getUserListings already filters status='active')
  const dbMyItems = await getUserListings(user.id)

  // Fetch all of the seller's active listings
  const dbSellerItems = await getUserListings(wantedListing.seller_id)

  // Fetch IDs of items already locked in pending/accepted proposals
  // Check BOTH legacy column and swap_proposal_items
  const { data: lockedProposals } = await supabase
    .from('swap_proposals')
    .select('id, offered_item_id')
    .eq('proposer_id', user.id)
    .in('status', ['pending', 'accepted'])

  const lockedProposalIds = (lockedProposals ?? []).map((p: any) => p.id)
  const legacyLockedIds = (lockedProposals ?? []).map((p: any) => p.offered_item_id).filter(Boolean)

  // Also get items locked via swap_proposal_items (multi-item proposals)
  let newStyleLockedIds: string[] = []
  if (lockedProposalIds.length > 0) {
    const { data: lockedItems } = await supabase
      .from('swap_proposal_items')
      .select('listing_id')
      .in('proposal_id', lockedProposalIds)
      .eq('side', 'offered')
    newStyleLockedIds = (lockedItems ?? []).map((i: any) => i.listing_id)
  }

  const lockedItemIds = [...new Set([...legacyLockedIds, ...newStyleLockedIds])]

  // Check cross-flow: already has pending purchase for this wanted item
  const { data: purchaseConflict } = await supabase
    .from('purchases')
    .select('id, purchase_items!inner(item_id)')
    .eq('buyer_id', user.id)
    .in('status', ['pending_seller_approval', 'accepted'])
    .eq('purchase_items.item_id', id)
    .maybeSingle()

  const myItems = dbMyItems.map(listingToItem)
  const sellerItems = dbSellerItems.map(listingToItem)

  return (
    <ProposeView
      wantedItem={wantedItem}
      sellerItems={sellerItems}
      receiver={receiverProfile}
      myItems={myItems}
      lockedItemIds={lockedItemIds}
      hasPurchaseConflict={!!purchaseConflict}
    />
  )
}
