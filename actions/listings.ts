'use server'

import { createServerClient } from '@/lib/supabase/server'
import { parsePriceToCents } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/queries/profiles'

export async function createListing(formData: {
  name: string
  brand: string
  size: string
  price: string
  description: string
  category: string
  condition: string
  images: string[]
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Ensure profile exists (self-healing will trigger if missing)
  await getCurrentUserProfile()

  // Get user's profile to check location sharing status
  const { data: profile } = await supabase
    .from('profiles')
    .select('location_sharing_enabled, precise_lat, precise_lng')
    .eq('id', user.id)
    .single()

  // Capture coordinates if location sharing is enabled
  const listingData: any = {
    seller_id: user.id,
    name: formData.name.trim(),
    brand: formData.brand.trim(),
    size: formData.size.trim(),
    price: parsePriceToCents(formData.price),
    description: formData.description.trim(),
    category: formData.category,
    condition: formData.condition,
    images: formData.images,
    status: 'active',
  }

  if (profile?.location_sharing_enabled && profile.precise_lat && profile.precise_lng) {
    listingData.listing_lat = profile.precise_lat
    listingData.listing_lng = profile.precise_lng
  }

  const { data, error } = await supabase
    .from('listings')
    .insert(listingData)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function deleteListing(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Check if listing has any active proposals or purchases
  const { data: activeProposals } = await supabase
    .from('swap_proposals')
    .select('id')
    .or(`offered_item_id.eq.${id},wanted_item_id.eq.${id}`)
    .in('status', ['pending', 'accepted'])

  const { data: activePurchases } = await supabase
    .from('purchase_items')
    .select('purchase_id, purchases(status)')
    .eq('item_id', id)
    .in('purchases.status', ['pending_seller_approval', 'accepted'])

  if ((activeProposals && activeProposals.length > 0) || (activePurchases && activePurchases.length > 0)) {
    throw new Error('Cannot delete listing with active swaps or purchases')
  }

  // Delete the listing completely
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) throw new Error(error.message)
  redirect('/profile')
}

export async function toggleSaveListing(listingId: string, currentlySaved: boolean) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('saved_listings')
    .eq('id', user.id)
    .single()

  const current: string[] = profile?.saved_listings ?? []
  const updated = currentlySaved
    ? current.filter((id) => id !== listingId)
    : [...current, listingId]

  const { error } = await supabase
    .from('profiles')
    .update({ saved_listings: updated })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}
