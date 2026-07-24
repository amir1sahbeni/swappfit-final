'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// The 4 main pages — fixed index-based carousel
const MAIN_TABS = ['/', '/notifications', '/chats', '/profile']

export function SwipeHandler() {
  const router = useRouter()
  const pathname = usePathname()

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const refreshingRef = useRef(false)
  const isNavigatingRef = useRef(false)

  // Unlock whenever the route actually changes
  useEffect(() => {
    isNavigatingRef.current = false
    setIsTransitioning(false)
  }, [pathname])

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0
    let isHorizontalSwipe: boolean | null = null
    let isPulling = false
    let currentPullY = 0

    // ─── TOUCH START ───────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
      isHorizontalSwipe = null
      isPulling = window.scrollY <= 0
      currentPullY = 0
    }

    // ─── TOUCH MOVE ────────────────────────────────────────────────────────────
    const onTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = Math.abs(currentX - startX)
      const diffY = currentY - startY
      const absDiffY = Math.abs(diffY)

      // Lock direction on first meaningful movement
      if (isHorizontalSwipe === null) {
        if (diffX > absDiffY && diffX > 10) {
          isHorizontalSwipe = true
        } else if (absDiffY > diffX && absDiffY > 10) {
          isHorizontalSwipe = false
        }
      }

      if (isHorizontalSwipe === true) {
        // Block native browser swipe-back/forward completely on all pages
        if (e.cancelable) e.preventDefault()
      } else if (isHorizontalSwipe === false && isPulling && diffY > 0) {
        // Pull-to-refresh
        if (e.cancelable) e.preventDefault()
        currentPullY = Math.min(diffY * 0.4, 100)
        setPullY(currentPullY)
      }
    }

    // ─── TOUCH END ─────────────────────────────────────────────────────────────
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - startX
      const deltaY = (e.changedTouches[0].clientY) - startY
      const elapsed = Date.now() - startTime

      // ── Pull-to-refresh ──
      if (isPulling && deltaY > 0) {
        isPulling = false
        if (currentPullY > 60 && !refreshingRef.current) {
          setRefreshing(true)
          refreshingRef.current = true
          window.location.reload()
          return
        } else {
          setPullY(0)
        }
      }

      // ── Bail-out checks ──
      if (elapsed > 500) return          // too slow
      if (isHorizontalSwipe === false) return // was a vertical scroll
      if (Math.abs(deltaX) < 40) return  // too short
      if (isNavigatingRef.current) return // already navigating

      // ── Determine page type fresh every time ──
      const isMainPage = MAIN_TABS.includes(pathname)

      // ═══════════════════════════════════════════════
      // MAIN PAGES — strict index-based carousel
      // ═══════════════════════════════════════════════
      if (isMainPage) {
        const currentIndex = MAIN_TABS.indexOf(pathname)
        if (currentIndex === -1) return

        if (deltaX < 0) {
          // ── Swipe LEFT → go to next tab ──
          // Hard boundary: if already on last tab, do nothing
          if (currentIndex >= MAIN_TABS.length - 1) return
          isNavigatingRef.current = true
          setIsTransitioning(true)
          // Use hard navigation — works even if the chunk was never loaded
          window.location.href = MAIN_TABS[currentIndex + 1]

        } else if (deltaX > 0) {
          // ── Swipe RIGHT → go to previous tab ──
          // Hard boundary: if already on first tab, do nothing
          if (currentIndex <= 0) return
          isNavigatingRef.current = true
          setIsTransitioning(true)
          window.location.href = MAIN_TABS[currentIndex - 1]
        }

      // ═══════════════════════════════════════════════
      // SECONDARY PAGES — stack-based back only
      // ═══════════════════════════════════════════════
      } else {
        // Only swipe LEFT triggers go-back. Swipe right is a completely dead gesture.
        if (deltaX < -40) {
          isNavigatingRef.current = true
          setIsTransitioning(true)
          router.back()
        }
        // deltaX > 0 (swipe right) → do absolutely nothing
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pathname, router])

  // ─── VISUAL INDICATOR (pull-to-refresh + page transition spinner) ──────────
  if (pullY <= 0 && !refreshing && !isTransitioning) return null

  return (
    <div
      className="fixed top-0 left-0 w-full flex justify-center z-[100] pointer-events-none transition-transform duration-200"
      style={{ transform: `translateY(${Math.max(pullY, refreshing || isTransitioning ? 60 : 0)}px)` }}
    >
      <div className="bg-card shadow-[0_4px_20px_rgba(192,57,91,0.15)] rounded-full p-2.5 border border-border mt-4">
        <Loader2
          className={`h-6 w-6 text-primary ${(refreshing || isTransitioning) ? 'animate-spin' : ''}`}
          style={{ transform: (refreshing || isTransitioning) ? 'none' : `rotate(${pullY * 4}deg)` }}
        />
      </div>
    </div>
  )
}
