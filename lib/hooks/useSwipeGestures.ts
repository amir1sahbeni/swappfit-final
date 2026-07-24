'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ROOT_PAGES = ['/', '/notifications', '/chats', '/profile', '/search']
const TAB_ORDER = ['/', '/notifications', '/chats', '/profile']

export function useSwipeGestures() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const elapsed = Date.now() - startTime

      // Pull to refresh logic (refresh if pulled down at top of page)
      if (window.scrollY <= 0 && deltaY > 120 && Math.abs(deltaY) > Math.abs(deltaX)) {
        window.location.reload()
        return
      }

      // Ignore if swipe took too long (scrolling)
      if (elapsed > 500) return

      // Ignore if more vertical than horizontal (scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX)) return

      // Ignore if swipe too short
      if (Math.abs(deltaX) < 80) return

      const isRootPage = ROOT_PAGES.includes(pathname)

      if (isRootPage) {
        // TAB SWITCHING ONLY
        const currentIndex = TAB_ORDER.indexOf(pathname)
        if (currentIndex === -1) return

        if (deltaX < 0) {
          // Swipe LEFT → next tab
          if (currentIndex < TAB_ORDER.length - 1) {
            router.push(TAB_ORDER[currentIndex + 1])
          }
        } else {
          // Swipe RIGHT → previous tab
          if (currentIndex > 0) {
            router.push(TAB_ORDER[currentIndex - 1])
          }
        }
      } else {
        // SWIPE BACK ONLY — right swipe from left edge
        if (deltaX > 0 && startX < 30) {
          router.back()
        }
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pathname, router])
}
