'use client'

import { useEffect, useState } from 'react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { createClient } from '@/lib/supabase/client'

export function PushProvider() {
  const [userId, setUserId] = useState<string | null>(null)
  const { permission, requestPermission } = usePushNotifications(userId)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err))
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        
        // Show prompt logic
        if ('Notification' in window && Notification.permission === 'default') {
          const asked = localStorage.getItem('push_permission_asked')
          if (!asked) {
            setShowPrompt(true)
          }
        }
      }
    })
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold tracking-tight text-foreground text-center">
          Stay in the loop
        </h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enable notifications to know when someone messages you or updates your swaps
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={async () => {
              localStorage.setItem('push_permission_asked', 'true')
              setShowPrompt(false)
              await requestPermission()
            }}
            className="w-full rounded-full bg-brand-gradient py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            Enable Notifications
          </button>
          <button
            onClick={() => {
              localStorage.setItem('push_permission_asked', 'true')
              setShowPrompt(false)
            }}
            className="w-full rounded-full bg-secondary py-3.5 text-sm font-medium text-secondary-foreground transition-transform active:scale-95"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
