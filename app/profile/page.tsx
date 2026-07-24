import Link from 'next/link'
import { Bell, Settings, MapPin, Star, Repeat, Heart } from 'lucide-react'
import { ProfileListings } from './profile-listings'
import { ProfileCard } from './profile-card'
import { BottomNav } from '@/components/bottom-nav'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getOwnerListings } from '@/lib/queries/listings'
import { getFollowStats } from '@/lib/queries/follows'
import { getUnreadNotificationCount } from '@/lib/queries/notifications'
import { listingToItem } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'


export default async function ProfilePage() {
  const t = await getTranslations('Profile')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/profile')


  const profile = await getCurrentUserProfile()
  // If authenticated but no profile row, redirect to home — not /auth.
  // Sending a logged-in user to /auth causes a redirect loop.
  if (!profile) redirect('/')

  const dbListings = await getOwnerListings(profile.id)
  const items = dbListings.map(listing => listingToItem(listing, profile))
  const followStats = await getFollowStats(profile.id)

  // Count unseen swap proposals for the red dot on My Swaps
  const { data: profileData } = await supabase
    .from('profiles')
    .select('swaps_viewed_at')
    .eq('id', user.id)
    .single()

  const seenAt = profileData?.swaps_viewed_at || '1970-01-01T00:00:00Z'
  const { count: unseenSwapCount } = await supabase
    .from('swap_proposals')
    .select('*', { count: 'exact', head: true })
    .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .gt('updated_at', seenAt)

  const hasUnseenSwaps = (unseenSwapCount || 0) > 0

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh pb-28 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-bold text-foreground">{t('title')}</h1>
        <div className="flex gap-3">
          <Link href="/settings" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="px-5">
        {/* Main Card */}
        <ProfileCard profile={profile} followStats={followStats} />

        {/* My Swaps Link */}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/swaps" className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-border transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Repeat className="h-5 w-5 text-foreground" />
                {hasUnseenSwaps && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t('mySwaps')}</p>
                <p className="text-[11px] text-muted-foreground">{t('mySwapsSubtitle')}</p>
              </div>
            </div>
          </Link>

          <Link href="/favourites" className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-border transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Heart className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t('favourites', { fallback: 'Favourites' })}</p>
                <p className="text-[11px] text-muted-foreground">{t('favouritesSubtitle', { fallback: 'View your saved items' })}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Listings */}
        <ProfileListings items={items} currentUserProfile={profile} />
      </div>
      
      <BottomNav />
    </main>
  )
}
