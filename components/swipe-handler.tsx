'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const ROOT_PAGES = ['/', '/notifications', '/chats', '/profile']
const TAB_ORDER = ['/', '/notifications', '/chats', '/profile']

export function SwipeHandler() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)

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

      // Lock direction on first significant movement
      if (isHorizontalSwipe === null) {
        if (diffX > absDiffY && diffX > 10) {
          isHorizontalSwipe = true
        } else if (absDiffY > diffX && absDiffY > 10) {
          isHorizontalSwipe = false
        }
      }

      const currentPageType = ROOT_PAGES.includes(pathname) ? 'main' : 'secondary'

      if (isHorizontalSwipe === true) {
        // Completely disable native browser swiping so we have 100% control over the rules
        if (e.cancelable) {
          e.preventDefault()
        }
      } else if (isHorizontalSwipe === false && isPulling && diffY > 0) {
        // Pull to refresh custom logic
        if (e.cancelable) e.preventDefault() // prevent overscroll bounce
        currentPullY = Math.min(diffY * 0.4, 100)
        setPullY(currentPullY)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const elapsed = Date.now() - startTime

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

      // Ignore if swipe took too long
      if (elapsed > 500) return

      // Ignore if it was clearly a vertical scroll lock
      if (isHorizontalSwipe === false) return

      // Ignore if swipe too short
      if (Math.abs(deltaX) < 40) return

      const currentPageType = ROOT_PAGES.includes(pathname) ? 'main' : 'secondary'
      const isRTL = document.documentElement.dir === 'rtl'

      if (currentPageType === 'main') {
        // MAIN PAGES: Index-based carousel logic
        const currentIndex = TAB_ORDER.indexOf(pathname)
        if (currentIndex === -1) return

        const logicalDeltaX = isRTL ? -deltaX : deltaX

        if (logicalDeltaX < 0) {
          // Swipe Forward visually → Next Tab
          if (currentIndex < TAB_ORDER.length - 1) {
            router.push(TAB_ORDER[currentIndex + 1])
          }
        } else if (logicalDeltaX > 0) {
          // Swipe Backward visually → Previous Tab
          if (currentIndex > 0) {
            router.push(TAB_ORDER[currentIndex - 1])
          }
        }
      } else {
        // SECONDARY PAGES: Stack-based back logic
        // Rule: Swipe left (deltaX < 0) = go back. Swipe right (deltaX > 0) = disabled/dead.
        if (deltaX < -40) {
          router.back()
        }
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

  if (pullY <= 0 && !refreshing) return null

  return (
    <div 
      className="fixed top-0 left-0 w-full flex justify-center z-[100] pointer-events-none transition-transform duration-200"
      style={{ transform: `translateY(${Math.max(pullY, refreshing ? 60 : 0)}px)` }}
    >
      <div className="bg-card shadow-[0_4px_20px_rgba(192,57,91,0.15)] rounded-full p-2.5 border border-border mt-4">
        <Loader2 
          className={`h-6 w-6 text-primary ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? 'none' : `rotate(${pullY * 4}deg)` }}
        />
      </div>
    </div>
  )
}
