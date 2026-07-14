"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Repeat, Star, Loader2 } from "lucide-react"
import type { Item, Profile } from "@/lib/types"
import { calculateDistance, formatDistance } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { toggleFavourite } from "@/app/actions/favourites"

interface ItemCardProps {
  item: Item
  currentUserProfile?: Profile | null
  priority?: boolean
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

export function ItemCard({ item, currentUserProfile, priority }: ItemCardProps) {
  const t = useTranslations('ItemCard')
  const locationDisplay = getLocationDisplay(item, currentUserProfile)
  
  const initialSaved = !!currentUserProfile?.favourites?.includes(item.id)
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserProfile) return
    const newSaved = !saved
    setSaved(newSaved)
    startTransition(() => {
      toggleFavourite(item.id, newSaved).catch(() => setSaved(!newSaved))
    })
  }

  return (
    <div className="relative group block overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(192,57,91,0.08)] transition-transform active:scale-95">
      <Link href={`/item/${item.id}`} className="block">
      <div className="relative aspect-square w-full">
        <Image 
          src={item.image || "/placeholder.svg"} 
          alt={item.name} 
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          priority={priority}
          className="object-cover no-rtl-flip" 
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur z-10">
          {item.condition}
        </span>

        {item.status === 'swapped' && (
          <span className="absolute left-2 top-8 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm z-10">
            {t('swapped')}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !currentUserProfile}
          aria-label="Save to favorites"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90 z-20"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
          ) : (
            <Heart className="h-3.5 w-3.5 text-primary" fill={saved ? "var(--primary)" : "none"} />
          )}
        </button>

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

export function ItemCardHero({ item, currentUserProfile, priority }: ItemCardProps) {
  const t = useTranslations('ItemCard')
  const locationDisplay = getLocationDisplay(item, currentUserProfile)

  const initialSaved = !!currentUserProfile?.favourites?.includes(item.id)
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserProfile) return
    const newSaved = !saved
    setSaved(newSaved)
    startTransition(() => {
      toggleFavourite(item.id, newSaved).catch(() => setSaved(!newSaved))
    })
  }

  return (
    <Link
      href={`/item/${item.id}`}
      className="block overflow-hidden rounded-2xl bg-card shadow-[0_8px_32px_rgba(192,57,91,0.10)] transition-transform active:scale-95"
    >
      <div className="relative aspect-[3/2] w-full">
        <Image 
          src={item.image || "/placeholder.svg"} 
          alt={item.name} 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          className="object-cover no-rtl-flip" 
        />

        {item.status === 'swapped' && (
          <span className="absolute left-3 top-3 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm z-10">
            {t('swapped')}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !currentUserProfile}
          aria-label="Save to favorites"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90 z-20"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Heart className="h-4 w-4 text-primary" fill={saved ? "var(--primary)" : "none"} />
          )}
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
