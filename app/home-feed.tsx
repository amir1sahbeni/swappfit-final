"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { ItemCard, ItemCardHero } from "@/components/item-card"
import { TOP_CATEGORIES, GENDER_FILTERS, CATEGORIES } from "@/lib/constants"
import type { Item, Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"

export function HomeFeed({ initialItems, followingIds = [], currentUserProfile }: { initialItems: Item[], followingIds?: string[], currentUserProfile?: Profile | null }) {
  const t = useTranslations("Home")
  const tCat = useTranslations("Categories")
  const tGender = useTranslations("Gender")
  const [activeCategory, setActiveCategory] = useState("all")
  const [showFollowing, setShowFollowing] = useState(false)
  const [items, setItems] = useState<Item[]>(initialItems)
  const [gender, setGender] = useState("women")
  const [showDropdown, setShowDropdown] = useState(false)

  // Load persisted gender
  useEffect(() => {
    const saved = localStorage.getItem("swappfit_gender")
    if (saved) setGender(saved)
  }, [])

  const handleGenderChange = (val: string) => {
    setGender(val)
    localStorage.setItem("swappfit_gender", val)
  }

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

  // Pull-to-refresh is handled globally by SwipeHandler in layout.tsx

  let filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory)
  
  if (showFollowing) {
    filtered = filtered.filter(i => followingIds.includes(i.sellerId))
  }
  
  // Apply gender filter
  filtered = filtered.filter(i => {
    if (gender === 'women') return i.gender === 'women' || i.gender === 'unisex' || !i.gender
    if (gender === 'men') return i.gender === 'men' || i.gender === 'unisex'
    if (gender === 'kids') return i.gender === 'kids'
    return true
  })
  
  const remaining = filtered
  
  // Nearby is the first of remaining
  const nearbyHero = remaining.length > 0 ? remaining[0] : null
  const recent = remaining.length > 1 ? remaining.slice(1) : remaining

  return (
    <>

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

        {/* Gender pills */}
        <div className="mt-5 flex justify-center gap-3">
          {GENDER_FILTERS.map(g => (
            <button
              key={g.value}
              onClick={() => handleGenderChange(g.value)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-transform active:scale-95 ${
                gender === g.value
                  ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{tGender(g.value as any)}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          <div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
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
            
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                activeCategory === 'all'
                  ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                  : "border border-secondary bg-transparent text-foreground"
              }`}
            >
              {tCat('all' as any)}
            </button>

            {TOP_CATEGORIES.map((catId) => {
              const active = catId === activeCategory
              return (
                <button
                  key={catId}
                  onClick={() => setActiveCategory(catId)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                    active
                      ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                      : "border border-secondary bg-transparent text-foreground"
                  }`}
                >
                  {tCat(catId as any)}
                </button>
              )
            })}
            
            {/* If the active category is not in TOP_CATEGORIES and not 'all', show it as a selected pill before More */}
            {activeCategory !== 'all' && !TOP_CATEGORIES.includes(activeCategory) && (
              <button
                onClick={() => setActiveCategory(activeCategory)}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
              >
                {tCat(activeCategory as any)}
              </button>
            )}

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 border border-secondary bg-transparent text-foreground flex items-center gap-1`}
            >
              {tCat('more' as any)} ▾
            </button>
          </div>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-5 top-full z-50 mt-2 max-h-[300px] w-48 overflow-y-auto rounded-2xl bg-card p-2 shadow-xl border border-border">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setActiveCategory(cat.value)
                      setShowDropdown(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      activeCategory === cat.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="flex-1">{tCat(cat.value as any) || cat.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
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
    <BottomNav />
    </>
  )
}
