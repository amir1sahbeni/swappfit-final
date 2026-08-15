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
import { LiveSwapBadge } from './live-swap-badge'

export const dynamic = 'force-dynamic'


export default async function ProfilePage() {
  const t = await getTranslations('Profile')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/profile')


  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/')

  // Run all independent queries in parallel instead of sequentially
  const [dbListings, followStats] = await Promise.all([
    getOwnerListings(profile.id),
    getFollowStats(profile.id),
  ])

  const items = dbListings.map(listing => listingToItem(listing, profile))
  
  // Track unseen swap activity — only recent (last 30 days), not hidden
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const [
    { count: countPropProposer },
    { count: countPropReceiver },
    { count: countPurchBuyer },
    { count: countPurchSeller }
  ] = await Promise.all([
    supabase.from('swap_proposals').select('*', { count: 'exact', head: true }).eq('proposer_id', user.id).eq('proposer_read', false).not('hidden_for', 'cs', `{${user.id}}`).gte('updated_at', since),
    supabase.from('swap_proposals').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('receiver_read', false).not('hidden_for', 'cs', `{${user.id}}`).gte('updated_at', since),
    supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('buyer_read', false).not('hidden_for', 'cs', `{${user.id}}`).gte('updated_at', since),
    supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('seller_read', false).not('hidden_for', 'cs', `{${user.id}}`).gte('updated_at', since)
  ])

  const unseenSwapCount = (countPropProposer || 0) + (countPropReceiver || 0) + (countPurchBuyer || 0) + (countPurchSeller || 0)
  const hasUnseenSwaps = unseenSwapCount > 0

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
                <LiveSwapBadge initialHasUnseen={hasUnseenSwaps} userId={user.id} />
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
