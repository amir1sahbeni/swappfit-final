"use client"

import Link from "next/link"
import { Heart, Repeat, Star } from "lucide-react"
import type { Item, Profile } from "@/lib/types"
import { calculateDistance, formatDistance } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface ItemCardProps {
  item: Item
  currentUserProfile?: Profile | null
}

function getLocationDisplay(item: Item, currentUserProfile?: Profile | null): string {
  // If viewer has location sharing enabled AND listing has coordinates
  if (
    currentUserProfile?.location_sharing_enabled &&
    currentUserProfile.precise_lat &&
    currentUserProfile.precise_lng &&
    item.listing_lat &&
    item.listing_lng
  ) {
    const distance = calculateDistance(
      currentUserProfile.precise_lat,
      currentUserProfile.precise_lng,
      item.listing_lat,
      item.listing_lng
    )
    return formatDistance(distance)
  }

  // Otherwise, show seller's general location (city, governorate)
  if (item.seller_city && item.seller_governorate) {
    return `${item.seller_city}, ${item.seller_governorate}`
  }

  // Fallback to old distance field if available
  return item.distance
}

export function ItemCard({ item, currentUserProfile }: ItemCardProps) {
  const t = useTranslations('ItemCard')
  const locationDisplay = getLocationDisplay(item, currentUserProfile)

  return (
    <div className="relative group block overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(192,57,91,0.08)] transition-transform active:scale-95">
      <Link href={`/item/${item.id}`} className="block">
      <div className="relative">
        <img src={item.image || "/placeholder.svg"} alt={item.name} className="aspect-square w-full object-cover no-rtl-flip" />
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {item.condition}
        </span>

        {item.status === 'swapped' && (
          <span className="absolute left-2 top-8 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm z-10">
            {t('swapped')}
          </span>
        )}
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 backdrop-blur">
          <Repeat className="h-3.5 w-3.5 text-primary" />
        </span>

      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-bold text-foreground">{item.name}</h3>
        <p className="mt-0.5 truncate text-sm font-bold text-primary">{item.price}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.brand}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{locationDisplay}</p>
      </div>
      </Link>
    </div>
  )
}

export function ItemCardHero({ item, currentUserProfile }: ItemCardProps) {
  const t = useTranslations('ItemCard')
  const locationDisplay = getLocationDisplay(item, currentUserProfile)

  return (
    <Link
      href={`/item/${item.id}`}
      className="block overflow-hidden rounded-2xl bg-card shadow-[0_8px_32px_rgba(192,57,91,0.10)] transition-transform active:scale-95"
    >
      <div className="relative">
        <img src={item.image || "/placeholder.svg"} alt={item.name} className="aspect-[3/2] w-full object-cover no-rtl-flip" />

        {item.status === 'swapped' && (
          <span className="absolute left-3 top-3 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm z-10">
            {t('swapped')}
          </span>
        )}
        <button
          aria-label="Save to favorites"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
        >
          <Heart className="h-4 w-4 text-primary" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-lg font-bold text-foreground">{item.name}</h2>
          <span className="shrink-0 text-lg font-bold text-primary">{item.price}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {item.brand} · {t('size')} {item.size} · {locationDisplay}
        </p>
      </div>
    </Link>
  )
}
