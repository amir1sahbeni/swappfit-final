'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function SwipeHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    let startX = 0
    let startY = 0
    let isValidEdgeSwipe = false

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      
      // ONLY intercept if swipe starts from the left edge (within 40px)
      isValidEdgeSwipe = startX < 40
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isValidEdgeSwipe) return
      
      const diffX = e.touches[0].clientX - startX
      const diffY = Math.abs(e.touches[0].clientY - startY)

      // If it's a valid edge swipe and going right, prevent default to stop native browser behavior
      if (diffX > 10 && diffX > diffY) {
        if (e.cancelable) e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!isValidEdgeSwipe) return

      const deltaX = e.changedTouches[0].clientX - startX
      const deltaY = Math.abs(e.changedTouches[0].clientY - startY)

      // Only handle right swipe (deltaX > 0)
      if (deltaX < 50 || deltaX < deltaY) return

      // Disable on main tabs
      const MAIN_TABS = ['/', '/notifications', '/chats', '/profile']
      if (MAIN_TABS.includes(pathname)) return

      if (isNavigatingRef.current) return
      
      isNavigatingRef.current = true
      router.back()
      setTimeout(() => { isNavigatingRef.current = false }, 800)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [router, pathname])

  return null
}
