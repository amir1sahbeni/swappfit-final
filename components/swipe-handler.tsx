'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function SwipeHandler() {
  const router = useRouter()

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    let startX = 0
    let startY = 0
    let isHorizontalSwipe: boolean | null = null
    let isPulling = false
    let currentPullY = 0

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      isHorizontalSwipe = null
      isPulling = window.scrollY <= 0
      currentPullY = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      const diffX = Math.abs(e.touches[0].clientX - startX)
      const diffY = e.touches[0].clientY - startY
      const absDiffY = Math.abs(diffY)

      if (isHorizontalSwipe === null) {
        if (diffX > absDiffY && diffX > 10) isHorizontalSwipe = true
        else if (absDiffY > diffX && absDiffY > 10) isHorizontalSwipe = false
      }

      if (isHorizontalSwipe === true) {
        if (e.cancelable) e.preventDefault()
      } else if (isHorizontalSwipe === false && isPulling && diffY > 0) {
        if (e.cancelable) e.preventDefault()
        currentPullY = Math.min(diffY * 0.4, 100)
        setPullY(currentPullY)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX
      const deltaY = e.changedTouches[0].clientY - startY

      // Pull-to-refresh
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

      // Only handle right swipe (deltaX > 0) = go back one page
      // ONLY on secondary pages — on main pages (home/notifications/chats/profile) it's a dead gesture
      const MAIN_TABS = ['/', '/notifications', '/chats', '/profile']
      const isMainPage = MAIN_TABS.includes(window.location.pathname)
      if (isMainPage) return
      if (isHorizontalSwipe !== true) return
      if (deltaX < 50) return
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
  }, [router])

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
