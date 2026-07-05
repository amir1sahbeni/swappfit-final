import { notFound, redirect } from "next/navigation"
import { getListingById } from "@/lib/queries/listings"
import { createServerClient } from "@/lib/supabase/server"
import { BuyView } from "./buy-view"
import { listingToItem, profileToSeller } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function BuyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const listing = await getListingById(id)
  if (!listing) notFound()

  // Must not be the seller
  if (listing.seller_id === user.id) redirect(`/item/${id}`)

  // Must be active
  if (listing.status !== 'active') redirect(`/item/${id}`)

  // Guard: same buyer already has pending/accepted purchase for this item
  const { data: existingPurchaseItems } = await supabase
    .from('purchase_items')
    .select('purchase_id')
    .eq('item_id', id)

  if (existingPurchaseItems && existingPurchaseItems.length > 0) {
    const purchaseIds = existingPurchaseItems.map((pi: any) => pi.purchase_id)
    const { data: myPending } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .in('id', purchaseIds)
      .in('status', ['pending_seller_approval', 'accepted'])
      .maybeSingle()

    if (myPending) {
      // Redirect to existing purchase instead of creating duplicate
      redirect(`/purchase/${myPending.id}`)
    }
  }

  // Guard: buyer has pending swap proposal for this item
  const { data: swapConflict } = await supabase
    .from('swap_proposals')
    .select('id')
    .eq('proposer_id', user.id)
    .eq('wanted_item_id', id)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (!listing.profiles) notFound()

  const item = listingToItem(listing)
  const seller = profileToSeller(listing.profiles)

  return <BuyView item={item} seller={seller} swapConflict={!!swapConflict} />
}
