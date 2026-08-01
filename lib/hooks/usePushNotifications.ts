'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePushNotifications(userId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    if (!('Notification' in window)) return
    setPermission(Notification.permission)
  }, [userId])

  const requestPermission = async () => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: JSON.stringify(sub)
      })
    }
  }

  return { permission, requestPermission }
}
