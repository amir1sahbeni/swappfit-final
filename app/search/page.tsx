"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, X, Loader2, Check, ChevronDown } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { ItemCard } from "@/components/item-card"
import { TOP_CATEGORIES, GENDER_FILTERS, CATEGORIES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { listingToItem } from "@/lib/utils"
import type { Item, Profile } from "@/lib/types"
import Link from "next/link"
import { useTranslations } from 'next-intl'

const STANDARD_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Multicolor', hex: 'conic-gradient(red, yellow, green, blue, purple, red)' }
] as const;

export default function SearchPage() {
  const t = useTranslations('Search')
  const tCat = useTranslations('Categories')
  const tSize = useTranslations('Sizes')
  const tColors = useTranslations('Colors')
  const tGender = useTranslations('Gender')
  const [searchMode, setSearchMode] = useState<"items" | "people">("items")
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeSize, setActiveSize] = useState("All")
  const [activeBrand, setActiveBrand] = useState("All")
  const [activeColors, setActiveColors] = useState<string[]>([])
  const [gender, setGender] = useState("women")
  const [showDropdown, setShowDropdown] = useState(false)
  const [isColorOpen, setIsColorOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(1000)
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

    const savedGender = localStorage.getItem("swappfit_gender")
    if (savedGender) setGender(savedGender)
  }, [supabase])

  const handleGenderChange = (val: string) => {
    setGender(val)
    localStorage.setItem("swappfit_gender", val)
  }

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

        if (activeCategory !== 'all') {
          dbQuery = dbQuery.eq('category', activeCategory)
        }

        if (gender === 'women') {
          dbQuery = dbQuery.in('gender', ['women', 'unisex', null]) // handle legacy nulls
        } else if (gender === 'men') {
          dbQuery = dbQuery.in('gender', ['men', 'unisex'])
        } else if (gender === 'kids') {
          dbQuery = dbQuery.eq('gender', 'kids')
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

        if (activeColors.length > 0) {
          dbQuery = dbQuery.in('color', activeColors)
        }

        if (minPrice > 0) {
          dbQuery = dbQuery.gte('price', minPrice * 100)
        }
        if (maxPrice < 1000) {
          dbQuery = dbQuery.lte('price', maxPrice * 100)
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
  }, [query, activeCategory, activeSize, activeBrand, activeColors, minPrice, maxPrice, supabase, searchMode])

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

      {/* Gender pills */}
      {searchMode === "items" && (
        <div className="mt-5 flex justify-center gap-3">
          {GENDER_FILTERS.map(g => (
            <button
              key={g.value}
              onClick={() => handleGenderChange(g.value)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-transform active:scale-95 ${
                gender === g.value
                  ? "bg-primary text-white shadow-[0_4px_12px_rgba(192,57,91,0.25)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{g.emoji}</span>
              <span>{tGender(g.value as any)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Panel - only for items mode */}
      {showFilters && searchMode === "items" && (
        <div className="mt-3 rounded-2xl bg-card p-4 shadow-sm border border-border flex flex-col gap-4">
          <div className="flex gap-3">
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
          
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('color')}</label>
            <button
              onClick={() => setIsColorOpen(!isColorOpen)}
              className={`flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm transition-colors ${activeColors.length > 0 ? 'border-primary/50 text-foreground' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                {activeColors.length === 0 ? (
                  <span>{t('anyColor', { defaultValue: 'Any color' })}</span>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {activeColors.map((colorName, idx) => {
                      const c = STANDARD_COLORS.find(col => col.name === colorName);
                      if (!c) return null;
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          {idx > 0 && <span className="text-muted-foreground/50">,</span>}
                          <div className="h-3 w-3 shrink-0 rounded-full border border-border/50" style={{ background: c.hex }} />
                          <span className="truncate">{tColors(colorName as any)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
            
            {isColorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsColorOpen(false)} />
                <div className="absolute top-[60px] left-0 right-0 z-50 rounded-xl bg-background border border-border shadow-lg p-2 max-h-60 overflow-y-auto">
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-muted-foreground transition-colors"
                    onClick={() => { setActiveColors([]); setIsColorOpen(false); }}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-muted">
                      <X className="h-3 w-3" />
                    </div>
                    <span>{t('clearColors', { defaultValue: 'Clear colors' })}</span>
                  </button>
                  
                  {STANDARD_COLORS.map((c) => {
                    const isSelected = activeColors.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        onClick={(e) => {
                          e.preventDefault();
                          if (isSelected) {
                            setActiveColors(prev => prev.filter(color => color !== c.name));
                          } else {
                            setActiveColors(prev => [...prev, c.name]);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm transition-colors ${isSelected ? 'bg-muted/50 font-medium text-foreground' : 'text-muted-foreground'}`}
                      >
                        <div 
                          className="h-5 w-5 rounded-full border border-border/50" 
                          style={{ background: c.hex }} 
                        />
                        <span>{tColors(c.name as any)}</span>
                        {isSelected && <Check className="h-4 w-4 ml-auto text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('priceRange')}</label>
              <span className="text-xs font-medium">${minPrice} - ${maxPrice === 1000 ? '1000+' : maxPrice}</span>
            </div>
            <div className="relative h-6 flex items-center">
              {/* Custom dual slider using two overlaid range inputs */}
              <div className="absolute inset-0 top-1/2 -mt-0.5 h-1 bg-muted rounded-full pointer-events-none" />
              <div 
                className="absolute inset-0 top-1/2 -mt-0.5 h-1 bg-primary rounded-full pointer-events-none" 
                style={{ 
                  left: `${(minPrice / 1000) * 100}%`, 
                  right: `${100 - (maxPrice / 1000) * 100}%` 
                }} 
              />
              <input 
                type="range" 
                min={0} max={1000} step={10} 
                value={minPrice} 
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), maxPrice - 10)
                  setMinPrice(val)
                }}
                className="absolute w-full h-1 opacity-0 cursor-pointer pointer-events-auto"
                style={{ zIndex: minPrice > 1000 - 100 ? 5 : 3 }}
              />
              <input 
                type="range" 
                min={0} max={1000} step={10} 
                value={maxPrice} 
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), minPrice + 10)
                  setMaxPrice(val)
                }}
                className="absolute w-full h-1 opacity-0 cursor-pointer pointer-events-auto z-4"
              />
              {/* Thumbs for visual representation */}
              <div className="absolute w-4 h-4 bg-primary rounded-full shadow top-1/2 -mt-2 pointer-events-none" style={{ left: `calc(${(minPrice / 1000) * 100}% - 8px)` }} />
              <div className="absolute w-4 h-4 bg-primary rounded-full shadow top-1/2 -mt-2 pointer-events-none" style={{ left: `calc(${(maxPrice / 1000) * 100}% - 8px)` }} />
            </div>
          </div>
        </div>
      )}

      {/* Category pills - only for items mode */}
      {searchMode === "items" && (
        <div className="flex flex-col gap-3 mt-4 relative">
          <div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
            <button
              onClick={() => { setActiveCategory('all'); setActiveSize('All'); }}
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
                  onClick={() => { setActiveCategory(catId); setActiveSize('All'); }}
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

            {activeCategory !== 'all' && !TOP_CATEGORIES.includes(activeCategory) && (
              <button
                onClick={() => { setActiveCategory(activeCategory); setActiveSize('All'); }}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 bg-brand-gradient text-primary-foreground shadow-[0_8px_18px_rgba(192,57,91,0.22)]"
              >
                {tCat(activeCategory as any)}
              </button>
            )}

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95 border border-secondary bg-transparent text-foreground flex items-center gap-1`}
            >
              {tCat("more" as any)} ▾
            </button>
          </div>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-5 top-[50px] z-50 mt-2 max-h-[300px] w-48 overflow-y-auto rounded-2xl bg-card p-2 shadow-xl border border-border">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setActiveCategory(cat.value)
                      setActiveSize("All")
                      setShowDropdown(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      activeCategory === cat.value ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1">{tCat(cat.value as any) || cat.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          
          {/* Active Colors Bar */}
          {activeColors.length > 0 && (
            <div className="hide-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">{t('color')}</span>
              {activeColors.map(colorName => {
                const colorDef = STANDARD_COLORS.find(c => c.name === colorName);
                if (!colorDef) return null;
                return (
                  <button
                    key={colorName}
                    onClick={() => setActiveColors(prev => prev.filter(c => c !== colorName))}
                    className="shrink-0 flex items-center gap-1.5 rounded-full px-2 py-1 pr-3 text-xs font-medium border border-primary bg-primary/5 transition-transform active:scale-95"
                  >
                    <div className="w-3.5 h-3.5 rounded-full border border-border/50" style={{ background: colorDef.hex }} />
                    <span className="text-primary">{tColors(colorName as any)}</span>
                    <X className="h-3 w-3 text-primary ml-0.5" />
                  </button>
                )
              })}
            </div>
          )}
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
