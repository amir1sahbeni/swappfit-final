"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Bell, ArrowRight, MessageCircle, Heart, Star, Repeat, ShoppingBag, CheckCheck } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { createClient } from "@/lib/supabase/client"
import { formatRelativeTime } from "@/lib/utils"
import { markAllNotificationsRead } from "@/app/actions/notifications"
import { useTranslations } from 'next-intl'

export default function NotificationsPage() {
  const t = useTranslations('NotificationsPage')
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    let channel: any

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setNotifications(data)
    }

    loadNotifications()

    // Unique channel name to prevent stale subscription conflicts
    channel = supabase
      .channel(`realtime_notifications_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      channel?.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    if (type.startsWith('purchase')) return <ShoppingBag className="h-3 w-3 text-white" />
    if (type.startsWith('swap')) return <Repeat className="h-3 w-3 text-white" />
    if (type === 'message') return <MessageCircle className="h-3 w-3 text-white" />
    if (type === 'like') return <Heart className="h-3 w-3 text-white" />
    if (type === 'rating') return <Star className="h-3 w-3 text-white" />
    return <Bell className="h-3 w-3 text-white" />
  }

  const getIconBg = (type: string) => {
    if (type.startsWith('purchase')) return 'bg-emerald-500'
    if (type.startsWith('swap')) return 'bg-primary'
    if (type === 'message') return 'bg-blue-500'
    if (type === 'like') return 'bg-pink-500'
    if (type === 'rating') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const parseNotifText = (notif: any) => {
    try {
      const data = JSON.parse(notif.text)
      
      switch (notif.type) {
        case 'purchase_request':
          return t('purchase_request', { itemName: data.itemName })
        case 'purchase_accepted':
          return t('purchase_accepted', { itemName: data.itemName })
        case 'purchase_completed':
          if (data.isSeller) return t('purchase_completed_seller', { itemName: data.itemName })
          return t('purchase_completed_buyer', { itemName: data.itemName })
        case 'purchase_rejected':
          return t('purchase_rejected', { itemName: data.itemName })
        case 'purchase_cancelled':
          return t('purchase_cancelled', { itemName: data.itemName })
          
        case 'swap_proposal':
          if (data.isProposer) return t('swap_proposal_sent', { offeredItemName: data.offeredItemName || 'Item', wantedItemName: data.wantedItemName || 'Item' })
          return t('swap_proposal', { wantedItemName: data.wantedItemName || 'Item' })
        case 'swap_accepted':
          if (data.isReceiver) return t('swap_accepted_receiver', { wantedItemName: data.wantedItemName || 'Item' })
          return t('swap_accepted_proposer', { wantedItemName: data.wantedItemName || 'Item' })
        case 'swap_completed':
          if (data.waitingForOther) return t('swap_waiting_confirmation', { itemName: data.wantedItemName || data.offeredItemName || 'Item' })
          return t('swap_completed')
        case 'swap_declined':
          return t('swap_declined', { wantedItemName: data.wantedItemName || 'Item' })
        case 'swap_cancelled':
          return t('swap_cancelled', { wantedItemName: data.wantedItemName || 'Item' })
          
        default:
          return notif.text
      }
    } catch (e) {
      if (notif.type.startsWith('purchase')) return t('fallback_purchase')
      if (notif.type.startsWith('swap')) return t('fallback_swap')
      return notif.text
    }
  }

  const handleNotifTap = (notif: any) => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
    const isOld = notif.created_at
      ? Date.now() - new Date(notif.created_at).getTime() > SEVEN_DAYS_MS
      : false

    const terminalStatuses = ['completed', 'cancelled', 'declined']
    const isTerminal = terminalStatuses.includes(notif.entity_status ?? '')

    if ((isOld || isTerminal) && notif.entity_id) {
      router.push(`/swaps`)
      return
    }

    if (notif.type === 'message') {
      router.push(`/chats/${notif.actor_id}`)
      return
    }
    if (notif.type.startsWith('swap')) {
      router.push(notif.entity_id ? `/exchange/${notif.entity_id}` : `/swaps`)
      return
    }
    if (notif.type.startsWith('purchase')) {
      router.push(notif.entity_id ? `/purchase/${notif.entity_id}` : `/swaps`)
      return
    }
    if (notif.type === 'rating') {
      router.push(`/profile`)
      return
    }
    router.push(`/`)
  }

  const hasUnread = notifications.some(n => !n.read)

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28">
      <header className="flex items-start justify-between bg-background pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        {hasUnread && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 mt-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            {t('markAllRead')}
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 mt-4">
        {notifications.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">{t('allCaughtUp')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('noNewNotifications')}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotifTap(notif)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-transform active:scale-95 ${
                notif.read 
                  ? "bg-transparent border border-border/40" 
                  : "bg-primary/5 shadow-sm border border-primary/10"
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <Image
                  src={notif.actor?.avatar_url || "/placeholder.svg"}
                  alt={notif.actor?.name || 'User'}
                  width={44}
                  height={44}
                  className="rounded-full object-cover shadow-sm ring-1 ring-border/50"
                />
                <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full shadow-sm ring-2 ring-background ${getIconBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-tight text-foreground/90">
                  {notif.actor?.name && <span className="font-semibold text-foreground">{notif.actor.name}</span>}
                  {" "}
                  {parseNotifText(notif)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">{formatRelativeTime(notif.created_at)}</p>
              </div>

              {!notif.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  )
}
