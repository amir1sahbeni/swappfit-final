"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * useSwipeBack — triggers router.back() when the user swipes right
 * from within the left 30px edge of the screen.
 *
 * Activation rules:
 *  - Touch must START within the leftmost 30px of the viewport
 *  - Horizontal swipe distance must be > 80px rightward
 *  - Vertical movement must be less than horizontal (to prevent conflicting with scroll)
 *
 * Pass `enabled={false}` on root pages where back navigation makes no sense.
 */
export function useSwipeBack(enabled: boolean = true) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      // Only activate if touch starts within the left 30px edge
      if (touch.clientX <= 30) {
        startX = touch.clientX
        startY = touch.clientY
        tracking = true
      } else {
        tracking = false
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = Math.abs(touch.clientY - startY)

      // Must be a rightward swipe > 80px, and more horizontal than vertical
      if (deltaX > 80 && deltaX > deltaY) {
        router.back()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - startX
      const deltaY = Math.abs(touch.clientY - startY)

      // If the movement becomes more vertical than horizontal, stop tracking
      if (deltaY > deltaX && deltaY > 20) {
        tracking = false
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, router])
}
