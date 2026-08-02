import { createServerClient } from '@/lib/supabase/server'
import type { Purchase } from '@/lib/types'

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const supabase = await createServerClient()

  // Fetch purchase row alone
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('id, buyer_id, seller_id, status, total_price, created_at, updated_at')
    .eq('id', id)
    .single()

  if (purchaseError || !purchase) {
    console.error('Purchase fetch error:', purchaseError)
    return null
  }

  // Fetch purchase_items separately (no price column)
  const { data: purchaseItems } = await supabase
    .from('purchase_items')
    .select('id, purchase_id, item_id')
    .eq('purchase_id', id)

  // Fetch listings separately using item_ids from purchase_items
  const itemIds = purchaseItems?.map((pi: any) => pi.item_id) || []
  let items: any[] = []
  if (itemIds.length > 0) {
    const { data: listings } = await supabase
      .from('listings')
      .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, updated_at, listing_lat, listing_lng, size_type, gender')
      .in('id', itemIds)
    items = listings || []
  }

  // Map listings back to purchase items
  const itemMap = new Map(items.map(item => [item.id, item]))
  const purchaseItemsWithListings = purchaseItems?.map((pi: any) => ({
    ...pi,
    item: itemMap.get(pi.item_id)
  }))

  // Fetch buyer profile separately
  const { data: buyer } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, bio, location, rating, review_count, swap_count, saved_listings, created_at, updated_at, precise_lat, precise_lng, location_sharing_enabled, governorate, city, agreed_to_terms_at, terms_version')
    .eq('id', purchase.buyer_id)
    .single()

  // Fetch seller profile separately
  const { data: seller } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, bio, location, rating, review_count, swap_count, saved_listings, created_at, updated_at, precise_lat, precise_lng, location_sharing_enabled, governorate, city, agreed_to_terms_at, terms_version')
    .eq('id', purchase.seller_id)
    .single()

  const result = {
    ...purchase,
    buyer,
    seller,
    items: purchaseItemsWithListings
  } as Purchase

  return result
}

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  const supabase = await createServerClient()

  // Fetch purchases alone
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, buyer_id, seller_id, status, total_price, created_at, updated_at')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error || !purchases) return []

  // Fetch purchase_items for all purchases
  const purchaseIds = purchases.map(p => p.id)
  const { data: purchaseItems } = await supabase
    .from('purchase_items')
    .select('id, purchase_id, item_id')
    .in('purchase_id', purchaseIds)

  // Fetch listings for all purchase_items
  const itemIds = purchaseItems?.map((pi: any) => pi.item_id) || []
  const { data: listings } = await supabase
    .from('listings')
    .select('id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, updated_at, listing_lat, listing_lng, size_type, gender')
    .in('id', itemIds)

  // Map listings to purchase_items
  const itemMap = new Map(listings?.map(item => [item.id, item]) || [])
  const purchaseItemsMap = new Map<string, any[]>()
  purchaseItems?.forEach((pi: any) => {
    if (!purchaseItemsMap.has(pi.purchase_id)) {
      purchaseItemsMap.set(pi.purchase_id, [])
    }
    purchaseItemsMap.get(pi.purchase_id)!.push({
      ...pi,
      item: itemMap.get(pi.item_id)
    })
  })

  // Fetch profiles for all purchases
  const userIds = new Set<string>()
  purchases.forEach(p => {
    userIds.add(p.buyer_id)
    userIds.add(p.seller_id)
  })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, handle, avatar_url, bio, location, rating, review_count, swap_count, saved_listings, created_at, updated_at, precise_lat, precise_lng, location_sharing_enabled, governorate, city, agreed_to_terms_at, terms_version')
    .in('id', Array.from(userIds))

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return purchases.map(purchase => ({
    ...purchase,
    buyer: profileMap.get(purchase.buyer_id),
    seller: profileMap.get(purchase.seller_id),
    items: purchaseItemsMap.get(purchase.id) || []
  })) as Purchase[]
}
