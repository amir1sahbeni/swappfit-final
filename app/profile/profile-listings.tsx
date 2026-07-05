"use client"

import { useState } from "react"
import { ItemCard } from "@/components/item-card"
import type { Item, Profile } from "@/lib/types"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"

export function ProfileListings({ items, currentUserProfile }: { items: Item[]; currentUserProfile?: Profile | null }) {
  const t = useTranslations('ProfileListings')

  return (
    <div className="mt-8">
      {/* Active Listings */}
      {items.filter(item => item.status === 'active').length > 0 && (
        <>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('active')}</p>
          <div className="grid grid-cols-2 gap-4">
            {items.filter(item => item.status === 'active').map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentUserProfile={currentUserProfile}
              />
            ))}
          </div>
        </>
      )}

      {/* Completed Listings */}
      {items.filter(item => item.status === 'swapped').length > 0 && (
        <>
          <p className="mt-8 mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('completed')}</p>
          <div className="grid grid-cols-2 gap-4">
            {items.filter(item => item.status === 'swapped').map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentUserProfile={currentUserProfile}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('noListingsYet')}</p>
      )}


    </div>
  )
}
