import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Listing, Profile, Item, Seller } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────
// Price helpers
// ─────────────────────────────────────────────

/** Format cents → display string, e.g. 12800 → "$128" */
export function formatPrice(cents: number): string {
  const dollars = Math.floor(cents / 100)
  return `$${dollars}`
}

/** Parse user input → cents, e.g. "128" or "$128.50" → 12850 */
export function parsePriceToCents(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '')
  return Math.round(parseFloat(cleaned || '0') * 100)
}

// ─────────────────────────────────────────────
// Relative time
// ─────────────────────────────────────────────

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return date.toLocaleDateString()
}

export function formatMessageTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  
  if (isToday) {
    return timeStr
  } else if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${days[date.getDay()]} ${timeStr}`
  } else {
    return `${date.toLocaleDateString()} ${timeStr}`
  }
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return date.toLocaleDateString()
}

// ─────────────────────────────────────────────
// DB → Legacy UI adapters
// Keep existing components (ItemCard, etc.) working without changes.
// ─────────────────────────────────────────────

export function listingToItem(listing: Listing, currentUserProfile?: Profile | null): Item {
  return {
    id: listing.id,
    name: listing.name,
    price: formatPrice(listing.price),
    image: listing.images?.[0] ?? '',
    category: listing.category,
    condition: listing.condition,
    brand: listing.brand,
    size: listing.size,
    description: listing.description,
    sellerId: listing.seller_id,
    distance: listing.profiles?.location ?? '',
    postedAt: formatRelativeTime(listing.created_at),
    isFeatured: !!listing.featured_until && new Date(listing.featured_until) > new Date(),
    status: listing.status,
    // Include location fields for distance calculation
    listing_lat: listing.listing_lat,
    listing_lng: listing.listing_lng,
    seller_city: listing.profiles?.city,
    seller_governorate: listing.profiles?.governorate,
  }
}

export function profileToSeller(profile: Profile): Seller {
  return {
    id: profile.id,
    name: profile.name,
    handle: profile.handle ?? '',
    avatar: profile.avatar_url ?? '',
    bio: profile.bio ?? '',
    rating: profile.rating ?? 0,
    reviews: profile.review_count ?? 0,
    swaps: profile.swap_count ?? 0,
    location: profile.location ?? '',
  }
}

// ─────────────────────────────────────────────
// Supabase Storage URL helper
// ─────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export function storageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

export async function compressImage(file: File, maxWidth = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Canvas to Blob failed'))
            }
          },
          'image/jpeg',
          0.85
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

// ─────────────────────────────────────────────
// Distance calculation (Haversine formula)
// Used for client-side display when both parties have location sharing enabled
// ─────────────────────────────────────────────

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string (e.g., "2.3 km away")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`
  }
  return `${distanceKm.toFixed(1)} km away`
}

