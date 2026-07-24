"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { ItemCard, ItemCardHero } from "@/components/item-card"
import { categories } from "@/lib/data"
import type { Item, Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"

const PULL_THRESHOLD = 80

export function HomeFeed({ initialItems, followingIds = [], currentUserProfile }: { initialItems: Item[], followingIds?: string[], currentUserProfile?: Profile | null }) {
  const t = useTranslations("Home")
  const [activeCategory, setActiveCategory] = useState("All")
  const [showFollowing, setShowFollowing] = useState(false)
  const [items, setItems] = useState<Item[]>(initialItems)

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Real-time: remove listings that become sold/swapped/removed
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`home_listings_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload) => {
          const updated = payload.new as any
          const newStatus = updated?.status
          // If the listing is no longer active, remove it from the feed immediately
          if (newStatus && newStatus !== 'active') {
            setItems(prev => prev.filter(item => item.id !== updated.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'listings' },
        (payload) => {
          const removed = payload.old as any
          if (removed?.id) {
            setItems(prev => prev.filter(item => item.id !== removed.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const fetchFreshListings = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      let { data: listings, error } = await supabase.rpc('get_distance_sorted_listings', {
        p_user_id: user?.id || null,
        p_limit: 50,
        p_offset: 0
      })

      if (error || !listings) {
        console.warn('RPC function not available, falling back to simple query:', error?.message)
        const res = await supabase
          .from('listings')
          .select(`
            *,
            profiles(id, name, avatar_url, governorate, city, precise_lat, precise_lng)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50)
        listings = res.data
      }

      if (listings) {
        // Map to Item shape (simplified — keeps current structure consistent)
        setItems(prev => {
          // We get raw DB rows; keep the same shape as initialItems
          // Use the existing items that match, plus add new ones
          const existingIds = new Set(prev.map(i => i.id))
          const freshIds = new Set((listings as any[]).map(l => l.id))
          // Remove items no longer active, keep existing ones that are still fresh
          return prev
            .filter(i => freshIds.has(i.id))
        })
      }
    } catch {
      // Silently fail on network error
    }
  }, [])

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      // Only trigger if page is scrolled to top
      if (window.scrollY > 5) return
      touchStartY.current = e.touches[0].clientY
      isPulling.current = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return
      if (window.scrollY > 5) {
        isPulling.current = false
        setPullY(0)
        return
      }

      const deltaY = e.touches[0].clientY - touchStartY.current
      if (deltaY > 0) {
        isPulling.current = true
        // Rubber-band effect: resistance increases as you pull further
        const resistance = Math.min(deltaY * 0.5, PULL_THRESHOLD + 20)
        setPullY(resistance)
        // Prevent page scroll while pulling
        if (deltaY > 10) {
          e.preventDefault()
        }
      } else {
        isPulling.current = false
        setPullY(0)
      }
    }

    const onTouchEnd = async () => {
      if (!isPulling.current) return
      const currentPull = pullY

      if (currentPull >= PULL_THRESHOLD * 0.5) {
        setIsRefreshing(true)
        setPullY(PULL_THRESHOLD * 0.5) // Snap to loading position
        await fetchFreshListings()
        // Brief delay so spinner is visible
        await new Promise(r => setTimeout(r, 600))
        setIsRefreshing(false)
      }

      isPulling.current = false
      setPullY(0)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isRefreshing, pullY, fetchFreshListings])

  let filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory)
  
  if (showFollowing) {
    filtered = filtered.filter(i => followingIds.includes(i.sellerId))
  }
  
  const remaining = filtered
  
  // Nearby is the first of remaining
  const nearbyHero = remaining.length > 0 ? remaining[0] : null
  const recent = remaining.length > 1 ? remaining.slice(1) : remaining

  // Pull indicator visibility
  const showPullIndicator = pullY > 0 || isRefreshing
  const pullProgress = Math.min(pullY / (PULL_THRESHOLD * 0.5), 1)

  return (
    <>
      <div
        ref={mainRef}
        style={{
          transform: showPullIndicator ? `translateY(${Math.min(pullY * 0.4, 32)}px)` : 'translateY(0)',
          transition: isRefreshing || pullY === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
      {/* Pull-to-refresh indicator */}
      {showPullIndicator && (
        <div
          className="fixed inset-x-0 z-40 flex justify-center"
          style={{
            top: Math.max(8, pullY * 0.3 - 20),
            opacity: Math.min(pullProgress * 2, 1),
            transition: isRefreshing ? 'opacity 0.2s ease' : 'none',
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-[0_4px_20px_rgba(192,57,91,0.18)]">
            <svg
              className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isRefreshing ? undefined : `rotate(${pullProgress * 360}deg)`,
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5">
        {/* Top bar */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Search bar */}
        <Link
          href="/search"
          className="mt-5 flex items-center gap-3 rounded-full bg-muted px-4 py-3.5"
        >
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{t("search")}</span>
          <SlidersHorizontal className="h-5 w-5 shrink-0 text-primary" />
        </Link>

        {/* Category pills */}
        <div className="hide-scrollbar -mx-5 mt-5 flex gap-2.5 overflow-x-auto px-5">
          <button
            onClick={() => setShowFollowing(!showFollowing)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
              showFollowing
                ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                : "border border-secondary bg-transparent text-foreground"
            }`}
          >
            {t("following")}
          </button>
          {categories.map((cat) => {
            const active = cat === activeCategory
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                  active
                    ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                    : "border border-secondary bg-transparent text-foreground"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            {showFollowing ? (
              <p className="text-sm text-muted-foreground">{t("noFollowing")}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t("noListings")}</p>
                <Link href="/create" className="mt-4 text-primary font-semibold text-sm">{t("beFirst")}</Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Nearby */}
            {nearbyHero && (
              <section className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("nearby")}</p>
                <div className="mt-3">
                  <ItemCardHero item={nearbyHero} currentUserProfile={currentUserProfile} priority={true} />
                </div>
              </section>
            )}

            {/* Recent grid */}
            <section className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("recent")}</p>
              {recent.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {recent.map((item) => (
                    <ItemCard key={item.id} item={item} currentUserProfile={currentUserProfile} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-center text-sm text-muted-foreground">{t("noRecent")}</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
    <BottomNav />
    </>
  )
}
