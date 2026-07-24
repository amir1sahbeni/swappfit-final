import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ItemCard } from "@/components/item-card"
import { BottomNav } from "@/components/bottom-nav"
import { PageHeader } from "@/components/page-header"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { listingToItem } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function FavouritesPage() {
  const t = await getTranslations('Favourites')
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth?redirect=/favourites')
  }

  const [profile, { data: favourites }] = await Promise.all([
    getCurrentUserProfile(),
    supabase
      .from('favourites')
      .select(`
        listing_id,
        listings (
          *,
          profiles!listings_seller_id_fkey(id, name, avatar_url, governorate, city, precise_lat, precise_lng)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ])

  const items = (favourites || [])
    .map(f => f.listings)
    .filter(Boolean)
    .map(listing => listingToItem(listing, profile))

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2 bg-background">
      <PageHeader title={t('title', { fallback: 'Favourites' })} />
      
      {items.length === 0 ? (
        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">{t('noFavourites', { fallback: 'You have no favourite items yet.' })}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} currentUserProfile={profile} />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  )
}
