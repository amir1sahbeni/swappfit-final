import { createServerClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types'
import { getBlockedUsers } from './blocks'

export async function getActiveListings(): Promise<Listing[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Try to use the PostGIS distance-sorted function first
  let { data, error } = await supabase.rpc('get_distance_sorted_listings', {
    p_user_id: user?.id || null,
    p_limit: 50,
    p_offset: 0
  })

  // If RPC fails (migration not applied yet), fall back to simple query
  if (error) {
    console.warn('RPC function not available, falling back to simple query:', error.message)
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles ( location, governorate, city, location_sharing_enabled, precise_lat, precise_lng )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // If user is logged in, exclude listings from blocked users
    if (user) {
      const blockedUsers = await getBlockedUsers(user.id)
      const blockedIds = blockedUsers.map(u => u.id)

      if (blockedIds.length > 0) {
        query = query.not('seller_id', 'in', `(${blockedIds.join(',')})`)
      }
    }

    const fallbackResult = await query
    if (fallbackResult.error) {
      console.error('Error fetching listings:', fallbackResult.error)
      return []
    }
    return fallbackResult.data as Listing[]
  }

  // Filter out blocked users client-side (since RPC doesn't support complex filtering)
  let listings = data as any[]

  if (user) {
    const blockedUsers = await getBlockedUsers(user.id)
    const blockedIds = blockedUsers.map(u => u.id)

    if (blockedIds.length > 0) {
      listings = listings.filter(l => !blockedIds.includes(l.seller_id))
    }
  }

  // Transform the flat result back to the expected nested structure
  return listings.map(l => ({
    id: l.id,
    seller_id: l.seller_id,
    name: l.name,
    brand: l.brand,
    size: l.size,
    price: l.price,
    description: l.description,
    category: l.category,
    condition: l.condition,
    images: l.images,
    status: l.status,
    created_at: l.created_at,
    updated_at: l.updated_at,
    featured_until: l.featured_until,
    listing_lat: l.listing_lat,
    listing_lng: l.listing_lng,
    profiles: {
      id: l.profiles_id,
      name: l.profiles_name,
      handle: l.profiles_handle,
      avatar_url: l.profiles_avatar_url,
      bio: l.profiles_bio,
      location: l.profiles_location,
      rating: l.profiles_rating,
      review_count: l.profiles_review_count,
      swap_count: l.profiles_swap_count,
      saved_listings: l.profiles_saved_listings,
      created_at: l.profiles_created_at,
      updated_at: l.profiles_updated_at,
      governorate: l.profiles_governorate,
      city: l.profiles_city,
      location_sharing_enabled: l.profiles_location_sharing_enabled,
      precise_lat: l.profiles_precise_lat,
      precise_lng: l.profiles_precise_lng,
    }
  }))
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles (*)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Listing
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles ( location, governorate, city, location_sharing_enabled, precise_lat, precise_lng )
    `)
    .eq('seller_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Listing[]
}

export async function getOwnerListings(userId: string): Promise<Listing[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles ( location, governorate, city, location_sharing_enabled, precise_lat, precise_lng )
    `)
    .eq('seller_id', userId)
    .in('status', ['active', 'swapped'])
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Listing[]
}

export async function searchListings(query: string): Promise<Listing[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles ( location, governorate, city, location_sharing_enabled, precise_lat, precise_lng )
    `)
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Listing[]
}
