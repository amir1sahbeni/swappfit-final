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
  color?: string
  images: string[]
  size_type?: string
  gender?: string
  lat?: number | null
  lng?: number | null
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
    color: formData.color || '',
    images: formData.images,
    size_type: formData.size_type,
    gender: formData.gender,
    status: 'active',
  }

  if (formData.lat && formData.lng) {
    listingData.listing_lat = formData.lat
    listingData.listing_lng = formData.lng
  } else if (profile?.location_sharing_enabled && profile.precise_lat && profile.precise_lng) {
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

  // We will perform a soft delete to avoid FK constraint violations
  // if this listing was ever proposed in a swap or purchased.
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) throw new Error(error.message)
  redirect('/profile')
}

export async function updateListing(id: string, formData: {
  name: string
  brand: string
  size: string
  price: string
  description: string
  category: string
  condition: string
  color: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('listings')
    .update({
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      size: formData.size.trim(),
      price: parsePriceToCents(formData.price),
      description: formData.description.trim(),
      category: formData.category,
      condition: formData.condition,
      color: formData.color,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) throw new Error(error.message)
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
