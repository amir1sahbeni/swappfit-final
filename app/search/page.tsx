"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ItemCard } from "@/components/item-card"
import { categories } from "@/lib/data"
import { createClient } from "@/lib/supabase/client"
import { listingToItem } from "@/lib/utils"
import type { Item, Profile } from "@/lib/types"
import Link from "next/link"
import { useTranslations } from 'next-intl'

export default function SearchPage() {
  const t = useTranslations('Search')
  const tCat = useTranslations('Categories')
  const tSize = useTranslations('Sizes')
  const [searchMode, setSearchMode] = useState<"items" | "people">("items")
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeSize, setActiveSize] = useState("All")
  const [activeBrand, setActiveBrand] = useState("All")
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentUserSearches, setRecentUserSearches] = useState<string[]>([])
  const [results, setResults] = useState<Item[]>([])
  const [userResults, setUserResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const stored = localStorage.getItem("swappfit_recent_searches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {}
    }
    const storedUserSearches = localStorage.getItem("swappfit_recent_user_searches")
    if (storedUserSearches) {
      try {
        setRecentUserSearches(JSON.parse(storedUserSearches))
      } catch (e) {}
    }

    // Fetch current user profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setCurrentUserProfile(data as Profile)
        })
      }
    })
  }, [supabase])

  function addRecentSearch(term: string) {
    if (!term.trim()) return
    const newSearches = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5)
    setRecentSearches(newSearches)
    localStorage.setItem("swappfit_recent_searches", JSON.stringify(newSearches))
  }

  function addRecentUserSearch(term: string) {
    if (!term.trim()) return
    const newSearches = [term, ...recentUserSearches.filter(t => t !== term)].slice(0, 5)
    setRecentUserSearches(newSearches)
    localStorage.setItem("swappfit_recent_user_searches", JSON.stringify(newSearches))
  }

  function deleteRecentSearch(term: string) {
    const newSearches = recentSearches.filter(t => t !== term)
    setRecentSearches(newSearches)
    localStorage.setItem("swappfit_recent_searches", JSON.stringify(newSearches))
  }

  function deleteRecentUserSearch(term: string) {
    const newSearches = recentUserSearches.filter(t => t !== term)
    setRecentUserSearches(newSearches)
    localStorage.setItem("swappfit_recent_user_searches", JSON.stringify(newSearches))
  }

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      
      if (searchMode === "people") {
        // Search users
        if (query.trim()) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`handle.ilike.%${query}%,name.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(50)

          if (!error && data) {
            setUserResults(data as Profile[])
          } else {
            setUserResults([])
          }
        } else {
          setUserResults([])
        }
      } else {
        // Search items
        let dbQuery = supabase
          .from('listings')
          .select(`*, profiles(location, governorate, city, location_sharing_enabled, precise_lat, precise_lng)`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (activeCategory !== 'All') {
          dbQuery = dbQuery.eq('category', activeCategory)
        }


        if (activeSize !== 'All') {
          if (activeSize === 'Kids (Under 35)') {
            dbQuery = dbQuery.lt('size', '35')
          } else {
            dbQuery = dbQuery.eq('size', activeSize)
          }
        }

        if (activeBrand !== 'All') {
          dbQuery = dbQuery.ilike('brand', `%${activeBrand}%`)
        }

        if (query.trim()) {
          dbQuery = dbQuery.or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
        }

        const { data, error } = await dbQuery

        if (!error && data) {
          setResults((data as any[]).map(listing => listingToItem(listing, currentUserProfile)))
        } else {
          setResults([])
        }
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      if (searchMode === "people" && query.trim() !== "") {
        fetchResults()
      } else if (searchMode === "items") {
        fetchResults()
      } else {
        if (searchMode === "people") {
          setUserResults([])
        } else {
          setResults([])
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activeCategory, activeSize, activeBrand, supabase, searchMode])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim() !== "") {
      if (searchMode === "people") {
        addRecentUserSearch(query.trim())
      } else {
        addRecentSearch(query.trim())
      }
    }
  }

  const showResults = searchMode === "people" ? query.trim() !== "" : true

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>

      {/* Items/People toggle */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setSearchMode("items")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
            searchMode === "items"
              ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
              : "border border-secondary bg-transparent text-foreground"
          }`}
        >
          {t('items')}
        </button>
        <button
          onClick={() => setSearchMode("people")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
            searchMode === "people"
              ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
              : "border border-secondary bg-transparent text-foreground"
          }`}
        >
          {t('people')}
        </button>
      </div>

      {/* Search bar */}
      <div className="mt-4 flex items-center gap-3 rounded-full bg-muted px-4 py-3.5">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchMode === "people" ? t('searchUsers') : t('searchClothes')}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button aria-label="Clear search" onClick={() => setQuery("")} className="shrink-0 active:scale-90">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        ) : searchMode === "items" ? (
          <button aria-label="Toggle filters" onClick={() => setShowFilters(!showFilters)} className="shrink-0 active:scale-90">
            <SlidersHorizontal className={`h-5 w-5 shrink-0 transition-colors ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
        ) : null}
      </div>

      {/* Filter Panel - only for items mode */}
      {showFilters && searchMode === "items" && (
        <div className="mt-3 rounded-2xl bg-card p-4 shadow-sm border border-border flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('brand')}</label>
            <input
              type="text"
              value={activeBrand === "All" ? "" : activeBrand}
              onChange={e => setActiveBrand(e.target.value || "All")}
              placeholder={t('placeholderBrand')}
              className="w-full rounded-xl bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('size')}</label>
            {activeCategory === "Accessories" ? (
              <input
                type="text"
                value={activeSize === "All" ? "" : activeSize}
                onChange={e => setActiveSize(e.target.value || "All")}
                placeholder="e.g. Adjustable"
                className="w-full rounded-xl bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            ) : (
              <select
                value={activeSize}
                onChange={e => setActiveSize(e.target.value)}
                className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground outline-none border-r-8 border-transparent"
              >
                <option value="All">{t('allSizes')}</option>
                {activeCategory === "Shoes" ? (
                  <>
                    <option value="Kids (Under 35)">{tSize("Kids (Under 35)")}</option>
                    {Array.from({ length: 14 }, (_, i) => 35 + i).map(size => (
                      <option key={size} value={size.toString()}>{size}</option>
                    ))}
                  </>
                ) : (activeCategory === "Trousers" || activeCategory === "Bottoms") ? (
                  <>
                    <option value="Kids">{tSize("Kids")}</option>
                    {["32", "34", "36", "38", "40", "42", "44", "46", "48", "50"].map(s => <option key={s} value={s}>{s}</option>)}
                  </>
                ) : (
                  <>
                    <option value="Kids">{t('kids')}</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="3XL">3XL</option>
                  </>
                )}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Category pills - only for items mode */}
      {searchMode === "items" && (
        <div className="hide-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5">
          {categories.map((cat) => {
            const active = cat === activeCategory
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveSize("All"); }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                  active
                    ? "bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
                    : "border border-secondary bg-transparent text-foreground"
                }`}
              >
                {tCat(cat as any)}
              </button>
            )
          })}
        </div>
      )}

      {!showResults && !showFilters ? (
        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('recentSearches')}</p>
          {searchMode === "people" ? (
            recentUserSearches.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1">
                {recentUserSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition-transform active:scale-95 hover:bg-muted cursor-pointer"
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm text-foreground">{term}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRecentUserSearch(term)
                      }}
                      className="ml-auto shrink-0 active:scale-90"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground text-center">{t('noRecentSearches')}</p>
            )
          ) : recentSearches.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition-transform active:scale-95 hover:bg-muted cursor-pointer"
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{term}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRecentSearch(term)
                    }}
                    className="ml-auto shrink-0 active:scale-90"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground text-center">{t('noRecentSearches')}</p>
          )}
        </section>
      ) : (
        <section className="mt-6">
          {searchMode === "people" ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {loading ? t('searching') : `${userResults.length} ${userResults.length === 1 ? t('result') : t('results')}`}
                </p>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              
              {userResults.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {userResults.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/user/${profile.id}`}
                      className="flex items-center gap-4 bg-card p-3 rounded-2xl shadow-[0_4px_20px_rgba(192,57,91,0.08)] transition-transform active:scale-95"
                    >
                      <img
                        src={profile.avatar_url || "/placeholder.svg"}
                        className="h-12 w-12 rounded-full object-cover"
                        alt={profile.name}
                      />
                      <div>
                        <p className="font-bold text-foreground">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">@{profile.handle?.replace('@', '') || profile.handle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !loading && (
                <p className="mt-8 text-center text-sm text-muted-foreground">{t('noUsersFound')}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {loading ? t('searching') : `${results.length} ${results.length === 1 ? t('result') : t('results')}`}
                </p>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {results.map((item) => (
                    <ItemCard key={item.id} item={item} currentUserProfile={currentUserProfile} />
                  ))}
                </div>
              ) : !loading && (
                <p className="mt-8 text-center text-sm text-muted-foreground">{t('noItemsMatch')}</p>
              )}
            </>
          )}
        </section>
      )}

      <BottomNav />
    </main>
  )
}
