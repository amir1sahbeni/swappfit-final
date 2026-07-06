"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSwipeBack } from "@/lib/hooks/useSwipeBack"

/**
 * Root pages where:
 * - Swipe-back does NOTHING (user is at a root destination)
 * - Tab-switching swipe IS active
 */
const ROOT_PAGES = ["/", "/notifications", "/chats", "/profile"]

/**
 * Tab order matches bottom nav left-to-right
 */
const TABS = ["/", "/notifications", "/chats", "/profile"]

const TAB_SWIPE_THRESHOLD = 60 // px

/**
 * ClientWrapper — applied inside the root layout to handle:
 * 1. Swipe-back gesture (non-root pages, left 30px edge → router.back())
 * 2. Tab-switch swipe (root pages only, horizontal full-width → navigate to adjacent tab)
 *
 * Priority (highest to lowest):
 *   Pull-to-refresh (vertical, handled in HomeFeed)
 *   Swipe-back (left edge, non-root only)
 *   Tab switch (full horizontal, root only)
 */
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isRootPage = ROOT_PAGES.some(p => pathname === p)

  // Swipe-back: active on non-root pages only
  useSwipeBack(!isRootPage)

  // Tab-switch swipe: active on root pages only
  useEffect(() => {
    if (!isRootPage) return

    let startX = 0
    let startY = 0
    let tracking = false

    const currentTabIndex = TABS.indexOf(pathname)

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      tracking = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const deltaY = Math.abs(e.touches[0].clientY - startY)
      const deltaX = Math.abs(e.touches[0].clientX - startX)

      // If primarily vertical, abort tab-switch tracking
      if (deltaY > deltaX && deltaY > 20) {
        tracking = false
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false

      const deltaX = e.changedTouches[0].clientX - startX
      const deltaY = Math.abs(e.changedTouches[0].clientY - startY)

      // Must be more horizontal than vertical, and meet threshold
      if (Math.abs(deltaX) < TAB_SWIPE_THRESHOLD || deltaY > Math.abs(deltaX)) return

      if (deltaX < 0) {
        // Swipe LEFT → go to NEXT tab
        if (currentTabIndex < TABS.length - 1) {
          router.push(TABS[currentTabIndex + 1])
        }
      } else {
        // Swipe RIGHT → go to PREVIOUS tab
        if (currentTabIndex > 0) {
          router.push(TABS[currentTabIndex - 1])
        }
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
  }, [isRootPage, pathname, router])

  return <>{children}</>
}
