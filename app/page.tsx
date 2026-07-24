import { HomeFeed } from "./home-feed"
import { getActiveListings } from "@/lib/queries/listings"
import { listingToItem } from "@/lib/utils"
import { createServerClient } from "@/lib/supabase/server"
import { getFollowing } from "@/lib/queries/follows"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { RealtimeRefresh } from "@/components/realtime-refresh"

export const dynamic = 'force-dynamic'


export default async function Page() {
  const listings = await getActiveListings()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let followingIds: string[] = []
  let currentUserProfile = null
  if (user) {
    const followingProfiles = await getFollowing(user.id)
    followingIds = followingProfiles.map(p => p.id)
    currentUserProfile = await getCurrentUserProfile()
  }

  const items = listings.map(listing => listingToItem(listing, currentUserProfile))

  return (
    <>
      <RealtimeRefresh table="listings" />
      <HomeFeed initialItems={items} followingIds={followingIds} currentUserProfile={currentUserProfile} />
    </>
  )
}
