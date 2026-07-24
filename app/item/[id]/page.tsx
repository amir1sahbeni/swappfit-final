import { notFound } from "next/navigation"
import { getListingById } from "@/lib/queries/listings"
import { getProfile, getCurrentUserProfile } from "@/lib/queries/profiles"
import { listingToItem, profileToSeller } from "@/lib/utils"
import { ItemDetailView } from "./item-detail-view"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'


export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const listing = await getListingById(id)
  if (!listing) notFound()

  const profile = await getProfile(listing.seller_id)
  if (!profile) notFound()

  const currentUser = await getCurrentUserProfile()
  const item = listingToItem(listing, currentUser)
  const seller = profileToSeller(profile)

  // Check if current user has saved this
  let isSaved = false
  let isOwner = false
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    if (user.id === listing.seller_id) isOwner = true

    const { data: fav } = await supabase.from('favourites').select('id').eq('user_id', user.id).eq('listing_id', listing.id).single()
    if (fav) {
      isSaved = true
    }
  }

  return <ItemDetailView item={item} seller={seller} initialSaved={isSaved} isOwner={isOwner} currentUserProfile={currentUser} />
}
