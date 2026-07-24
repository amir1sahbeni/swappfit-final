'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// The 4 main pages — fixed index-based carousel.
// Order is LTR-logical. RTL flip is applied at swipe-time.
const MAIN_TABS = ['/', '/notifications', '/chats', '/profile']

export function SwipeHandler() {
  const router = useRouter()
  const pathname = usePathname()

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const refreshingRef = useRef(false)
  const isNavigatingRef = useRef(false)

  // Unlock the swipe lock whenever the URL actually changes
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

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
      isHorizontalSwipe = null
      isPulling = window.scrollY <= 0
      currentPullY = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = Math.abs(currentX - startX)
      const diffY = currentY - startY
      const absDiffY = Math.abs(diffY)

      // Lock swipe direction on first meaningful movement
      if (isHorizontalSwipe === null) {
        if (diffX > absDiffY && diffX > 10) {
          isHorizontalSwipe = true
        } else if (absDiffY > diffX && absDiffY > 10) {
          isHorizontalSwipe = false
        }
      }

      if (isHorizontalSwipe === true) {
        // Kill native browser swipe-to-go-back/forward on ALL pages
        if (e.cancelable) e.preventDefault()
      } else if (isHorizontalSwipe === false && isPulling && diffY > 0) {
        // Pull-to-refresh visual feedback
        if (e.cancelable) e.preventDefault()
        currentPullY = Math.min(diffY * 0.4, 100)
        setPullY(currentPullY)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - startX
      const deltaY = e.changedTouches[0].clientY - startY
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

      // ── Bail-out guards (checked fresh every time) ──
      if (elapsed > 500) return           // took too long, probably not a swipe
      if (isHorizontalSwipe === false) return // was a vertical scroll
      if (Math.abs(deltaX) < 40) return   // too short to count
      if (isNavigatingRef.current) return  // already in flight, ignore

      // ── Determine page type LIVE on every gesture ──
      const isMainPage = MAIN_TABS.includes(pathname)

      // RTL apps (Arabic): the visual tab order is the mirror of LTR.
      // Home is on the right, Profile is on the left.
      // So we invert the swipe direction to match what the user sees.
      const isRTL = document.documentElement.dir === 'rtl'

      if (isMainPage) {
        // ════════════════════════════════════════════
        // MAIN PAGES — index-based carousel, hard boundaries
        // ════════════════════════════════════════════
        const currentIndex = MAIN_TABS.indexOf(pathname)
        if (currentIndex === -1) return

        // goForward = move to higher index (visually: next tab in reading direction)
        const goForward  = isRTL ? deltaX > 0 : deltaX < 0
        const goBackward = isRTL ? deltaX < 0 : deltaX > 0

        if (goForward) {
          // Hard boundary: already at last tab → dead gesture, do nothing
          if (currentIndex >= MAIN_TABS.length - 1) return
          isNavigatingRef.current = true
          setIsTransitioning(true)
          // replace() instead of href: does NOT add to history, so listings can never come back via native swipe
          window.location.replace(MAIN_TABS[currentIndex + 1])

        } else if (goBackward) {
          // Hard boundary: already at first tab → dead gesture, do nothing
          if (currentIndex <= 0) return
          isNavigatingRef.current = true
          setIsTransitioning(true)
          window.location.replace(MAIN_TABS[currentIndex - 1])
        }

      } else {
        // ════════════════════════════════════════════
        // SECONDARY PAGES — stack-based back ONLY
        // Swipe in the "back" direction = pop stack.
        // Swipe in the "forward" direction = completely dead gesture.
        // ════════════════════════════════════════════
        const isBackSwipe = isRTL ? deltaX > 40 : deltaX < -40
        if (isBackSwipe) {
          isNavigatingRef.current = true
          setIsTransitioning(true)
          router.back()
        }
        // Any other direction on a secondary page: silently ignored
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

  // ─── Visual spinner: shown during pull-to-refresh AND page transitions ───────
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
