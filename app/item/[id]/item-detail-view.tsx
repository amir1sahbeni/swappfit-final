"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, Heart, Share2, Star, MapPin, ShieldCheck, Loader2, MoreVertical, Trash2, X, ZoomIn } from "lucide-react"
import type { Item, Seller, Profile } from "@/lib/types"
import { deleteListing } from "@/app/actions/listings"
import { toggleFavourite } from "@/app/actions/favourites"
import { createPurchase } from "@/app/actions/purchases"
import { calculateDistance, formatDistance } from "@/lib/utils"
import { useTranslations } from 'next-intl'

export function ItemDetailView({ item, seller, initialSaved, isOwner, currentUserProfile }: { item: Item; seller: Seller; initialSaved: boolean; isOwner?: boolean; currentUserProfile?: Profile | null }) {
  const t = useTranslations('ItemDetail')
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [isSaving, setIsSaving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [listingStatus, setListingStatus] = useState(item.status || 'active')

  // Zoom and Pan states
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showPinchHint, setShowPinchHint] = useState(true)
  const touchState = useRef({
    isZooming: false,
    initialDistance: 0,
    initialScale: 1,
    isPanning: false,
    startX: 0,
    startY: 0,
    initialPan: { x: 0, y: 0 },
    lastTapTime: 0
  })

  useEffect(() => {
    const timer = setTimeout(() => setShowPinchHint(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (scale > 1) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [scale])

  function getDistance(touches: React.TouchList) {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      touchState.current.isZooming = true
      touchState.current.initialDistance = getDistance(e.touches)
      touchState.current.initialScale = scale
    } else if (e.touches.length === 1) {
      const now = Date.now()
      if (now - touchState.current.lastTapTime < 300) {
        // Double tap
        if (scale > 1) {
          setScale(1)
          setPan({ x: 0, y: 0 })
        } else {
          setScale(2.5)
        }
        touchState.current.lastTapTime = 0
      } else {
        touchState.current.lastTapTime = now
        if (scale > 1) {
          touchState.current.isPanning = true
          touchState.current.startX = e.touches[0].clientX
          touchState.current.startY = e.touches[0].clientY
          touchState.current.initialPan = { ...pan }
        }
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchState.current.isZooming && e.touches.length === 2) {
      // Prevent default scrolling when zooming
      if (e.cancelable) e.preventDefault()
      const currentDistance = getDistance(e.touches)
      const newScale = touchState.current.initialScale * (currentDistance / touchState.current.initialDistance)
      setScale(Math.min(Math.max(1, newScale), 4))
    } else if (touchState.current.isPanning && e.touches.length === 1 && scale > 1) {
      // Prevent default scrolling when panning
      if (e.cancelable) e.preventDefault()
      const dx = e.touches[0].clientX - touchState.current.startX
      const dy = e.touches[0].clientY - touchState.current.startY
      
      const maxPanX = (window.innerWidth * (scale - 1)) / 2
      const maxPanY = (window.innerWidth * (scale - 1)) / 2 
      
      setPan({
        x: Math.min(Math.max(touchState.current.initialPan.x + dx, -maxPanX), maxPanX),
        y: Math.min(Math.max(touchState.current.initialPan.y + dy, -maxPanY), maxPanY)
      })
    }
  }

  function handleTouchEnd() {
    touchState.current.isZooming = false
    touchState.current.isPanning = false
    if (scale < 1) {
      setScale(1)
      setPan({ x: 0, y: 0 })
    }
  }

  // Realtime stale guard: if another buyer purchases/swaps while we're viewing, hide the action buttons
  useEffect(() => {
    const { createClient } = require('@/lib/supabase/client')
    const supabase = createClient()
    const channel = supabase
      .channel(`listing_${item.id}_status`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${item.id}` },
        (payload: any) => {
          if (payload.new?.status) setListingStatus(payload.new.status)
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [item.id])

  async function handleSave() {
    const newSaved = !saved
    setSaved(newSaved) // optimistic update
    setIsSaving(true)
    try {
      await toggleFavourite(item.id, newSaved)
    } catch (err: any) {
      // Roll back the optimistic update on failure
      setSaved(!newSaved)
      console.error('Failed to toggle favourite:', err?.message || err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out this ${item.name} on SwappFit!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this listing?")) {
      startTransition(() => {
        deleteListing(item.id)
      })
    }
    setIsMenuOpen(false)
  }

  function getLocationDisplay(): string {
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
    return item.distance || t('locationHidden')
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh pb-44">
      {/* Image with floating controls */}
      <div className="relative overflow-hidden">
        {/* Bug 8: tapping image opens fullscreen viewer */}
        <button
          onClick={() => {
            if (scale === 1) setViewerOpen(true)
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="block w-full text-left relative aspect-square transition-transform duration-100 ease-out"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, touchAction: scale > 1 ? 'none' : 'auto' }}
          aria-label="View full image"
        >
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
            className="object-cover no-rtl-flip pointer-events-none"
          />
        </button>
        <button
          aria-label="Go back"
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground rtl-flip" />
        </button>
        {isOwner && (
          <button
            onClick={() => setIsMenuOpen(true)}
            className="absolute left-16 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            aria-label="Share"
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
          >
            <Share2 className="h-5 w-5 text-foreground" />
          </button>
          <button
            aria-label="Save to favorites"
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur transition-transform active:scale-90"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Heart className="h-5 w-5 text-primary" fill={saved ? "var(--primary)" : "none"} />
            )}
          </button>
        </div>
        <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {item.condition}
        </span>
        {/* Tap to zoom hint */}
        <span 
          className={`absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur transition-opacity duration-500 ${showPinchHint ? 'opacity-100' : 'opacity-0'}`}
        >
          <ZoomIn className="h-3 w-3" />
          {t('pinchToZoom', { fallback: 'Pinch to zoom' })}
        </span>
      </div>

      <div className="px-5">
        {/* Title + price */}
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">{item.name}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {item.brand} · {t('size')} {item.size}
            </p>
          </div>
          <span className="shrink-0 text-xl font-bold text-primary">{item.price}</span>
        </div>

        {/* Meta chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {getLocationDisplay()}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t('verifiedItem')}
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {item.postedAt}
          </span>
        </div>

        {/* Description */}
        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('description')}</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{item.description}</p>
        </section>

        {/* Seller */}
        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('seller')}</p>
          <Link
            href={`/user/${seller.id}`}
            className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[0_4px_20px_rgba(192,57,91,0.08)] transition-transform active:scale-95"
          >
            <Image src={seller.avatar || "/placeholder.svg"} alt={seller.name} width={48} height={48} className="rounded-full object-cover no-rtl-flip" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{seller.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-primary" fill="var(--primary)" />
                {seller.rating} · {seller.swaps} swaps
              </p>
            </div>
          </Link>
        </section>
      </div>

      {/* Sticky action bar */}
      {!isOwner && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
          {(listingStatus === 'swapped' || listingStatus === 'sold' || item.status === 'swapped' || item.status === 'sold') ? (
            <div className="flex h-12 w-full items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {t('noLongerAvailable')}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Row 1: Primary CTA — Buy */}
              <Link
                href={`/buy/${item.id}`}
                className="flex h-12 w-full items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95"
              >
                {t('buy')}
              </Link>
              {/* Row 2: Secondary actions — Message & Propose Swap */}
              <div className="flex gap-2">
                <Link
                  href={`/chats/${item.sellerId}`}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
                >
                  {t('message')}
                </Link>
                <Link
                  href={`/propose/${item.id}`}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
                >
                  {t('proposeSwap')}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Menu Action Sheet */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-5 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-[390px] rounded-[32px] bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:rounded-3xl sm:slide-in-from-bottom-0 sm:fade-in-0">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">{t('listingOptions')}</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-left transition-transform active:scale-95"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-destructive shadow-sm">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-destructive">{t('deleteListing')}</p>
                  <p className="text-xs text-destructive/80">{t('deleteListingConfirm')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug 8: Fullscreen image viewer */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewerOpen(false)}
        >
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-transform active:scale-90"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative w-[95vw] h-[85vh] max-w-4xl">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              fill
              className="rounded-2xl object-contain shadow-2xl no-rtl-flip"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  )
}
