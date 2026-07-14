import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, MapPin, Star, MessageCircle, MoreVertical } from "lucide-react"
import { ItemCard } from "@/components/item-card"
import { getProfile, getCurrentUserProfile } from "@/lib/queries/profiles"
import { getUserListings } from "@/lib/queries/listings"
import { listingToItem } from "@/lib/utils"
import { getFollowStats, isFollowing } from "@/lib/queries/follows"
import { FollowButton } from "@/components/follow-button"
import { redirect, RedirectType } from "next/navigation"
import { UserActionMenu } from "@/components/user-action-menu"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('UserProfile')
  const { id } = await params
  
  const profile = await getProfile(id)
  if (!profile) notFound()

  const currentUser = await getCurrentUserProfile()
  const followStats = await getFollowStats(id)
  
  let following = false
  if (currentUser && currentUser.id !== id) {
    following = await isFollowing(currentUser.id, id)
  }

  const dbListings = await getUserListings(id)
  const items = dbListings.map(listing => listingToItem(listing, currentUser))

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh pb-10 bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 pt-12 pb-4">
        <Link
          href="/"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-card shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-foreground transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[28px] font-bold text-foreground">{t('title', { fallback: 'Profile' })}</h1>
      </header>

      <div className="px-5">
        <div className="flex flex-col items-center rounded-3xl bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-2">
          <Image 
            src={profile.avatar_url || '/placeholder.svg'} 
            alt={profile.name} 
            width={96}
            height={96}
            priority
            className="rounded-full object-cover" 
          />
          <h2 className="mt-4 text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">@{profile.handle?.replace('@', '') || profile.handle}</p>
          
          <p className="mt-4 text-center text-[15px] text-foreground leading-relaxed px-2">
            {profile.bio || t('noBio', { fallback: 'No bio yet.' })}
          </p>
          
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {profile.city && profile.governorate ? `${profile.city}, ${profile.governorate}` : (profile.location || t('locationNotSet', { fallback: 'Location not set' }))}
          </p>

          {/* Stats Pill */}
          <div className="mt-6 flex w-full items-center justify-between rounded-[24px] bg-muted py-4 px-2">
            <div className="flex flex-1 flex-col items-center border-r border-border">
              <p className="text-lg font-bold text-foreground">{followStats.followers}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('followers', { fallback: 'Followers' })}</p>
            </div>
            <div className="flex flex-1 flex-col items-center border-r border-border">
              <p className="text-lg font-bold text-foreground">{followStats.following}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('following', { fallback: 'Following' })}</p>
            </div>
            <div className="flex flex-1 flex-col items-center border-r border-border">
              <p className="text-lg font-bold text-foreground">{profile.swap_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('swaps', { fallback: 'Swaps' })}</p>
            </div>
            <div className="flex flex-1 flex-col items-center">
              <p className="flex items-center gap-1 text-lg font-bold text-foreground">
                <Star className="h-4 w-4 text-primary" fill="currentColor" /> {profile.rating}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t('rating', { fallback: 'Rating' })}</p>
            </div>
          </div>

          {currentUser && currentUser.id !== id && (
            <div className="mt-5 flex w-full gap-3">
              <FollowButton
                followerId={currentUser.id}
                followingId={id}
                initialIsFollowing={following}
                className="flex-1 h-[52px] rounded-2xl flex items-center justify-center text-sm"
              />
              <Link
                href={`/chats/${id}`}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-muted text-sm font-bold text-foreground transition-transform active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                {t('message', { fallback: 'Message' })}
              </Link>
              <UserActionMenu currentUserId={currentUser.id} targetUserId={id} />
            </div>
          )}
        </div>

        <section className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('closet', { fallback: 'Closet' })}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} currentUserProfile={currentUser} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">{t('noActiveItems', { fallback: 'This user has no active items.' })}</p>
          )}
        </section>
      </div>
    </main>
  )
}
