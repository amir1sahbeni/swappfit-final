import { HomeFeed } from "./home-feed"
import { getActiveListings } from "@/lib/queries/listings"
import { listingToItem } from "@/lib/utils"
import { createServerClient } from "@/lib/supabase/server"
import { getFollowing } from "@/lib/queries/follows"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { RealtimeRefresh } from "@/components/realtime-refresh"

export const dynamic = 'force-dynamic'


export default async function Page() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Run listings + user data in parallel
  const [listings, currentUserProfile] = await Promise.all([
    getActiveListings(),
    user ? getCurrentUserProfile() : Promise.resolve(null),
  ])

  let followingIds: string[] = []
  if (user) {
    const followingProfiles = await getFollowing(user.id)
    followingIds = followingProfiles.map(p => p.id)
  }

  const items = listings.map(listing => listingToItem(listing, currentUserProfile))

  return (
    <>
      <RealtimeRefresh table="listings" />
      <HomeFeed initialItems={items} followingIds={followingIds} currentUserProfile={currentUserProfile} />
    </>
  )
}
