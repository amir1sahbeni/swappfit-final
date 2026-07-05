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

  // Fetch IDs of items already locked in pending/accepted proposals (as offeredItem)
  const { data: lockedProposals } = await supabase
    .from('swap_proposals')
    .select('offered_item_id')
    .eq('proposer_id', user.id)
    .in('status', ['pending', 'accepted'])

  const lockedItemIds = (lockedProposals ?? []).map((p: any) => p.offered_item_id as string)

  // Check cross-flow: already has pending purchase for this wanted item
  const { data: purchaseConflict } = await supabase
    .from('purchases')
    .select('id, purchase_items!inner(item_id)')
    .eq('buyer_id', user.id)
    .in('status', ['pending_seller_approval', 'accepted'])
    .eq('purchase_items.item_id', id)
    .maybeSingle()

  const myItems = dbMyItems.map(listingToItem)

  return (
    <ProposeView
      wantedItem={wantedItem}
      receiver={receiverProfile}
      myItems={myItems}
      lockedItemIds={lockedItemIds}
      hasPurchaseConflict={!!purchaseConflict}
    />
  )
}
