"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Bell, Plus, MessageCircle, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('Nav')
  const tAuth = useTranslations('Auth')
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadSwapCount, setUnreadSwapCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let notifChannel: any
    let messageChannel: any
    let swapChannel: any

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setIsAuthenticated(true)

      // Track unread notifications
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (count !== null) setUnreadCount(count)

      notifChannel = supabase
        .channel(`nav_notifs_${user.id}_${Date.now()}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        }, () => {
          supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false)
            .then(({ count }) => {
              if (count !== null) setUnreadCount(count)
            })
        })
        .subscribe()

      // Track unread messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          messages!inner(id, sender_id, read_at)
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)

      const totalUnread = (conversations || []).reduce((acc: number, conv: any) => {
        const unreadInConv = (conv.messages || []).filter(
          (m: any) => m.sender_id !== user.id && !m.read_at
        ).length
        return acc + unreadInConv
      }, 0)

      setUnreadMessageCount(totalUnread)

      messageChannel = supabase
        .channel(`nav_messages_${user.id}_${Date.now()}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages"
        }, async (payload: any) => {
          const newMessage = payload.new
          const isRecipient = newMessage.sender_id !== user.id

          if (isRecipient) {
            setUnreadMessageCount(prev => prev + 1)
          }
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "messages"
        }, async (payload: any) => {
          const updatedMessage = payload.new
          if (updatedMessage.read_at && !payload.old.read_at) {
            setUnreadMessageCount(prev => Math.max(0, prev - 1))
          }
        })
        .subscribe()

      // Track unseen swap activity (proposals updated after swaps_viewed_at)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('swaps_viewed_at')
        .eq('id', user.id)
        .single()

      const seenAt = profileData?.swaps_viewed_at

      const { count: swapCount } = await supabase
        .from('swap_proposals')
        .select('*', { count: 'exact', head: true })
        .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gt('updated_at', seenAt || '1970-01-01T00:00:00Z')

      if (swapCount !== null && swapCount > 0) setUnreadSwapCount(swapCount)

      swapChannel = supabase
        .channel(`nav_swaps_${user.id}_${Date.now()}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "swap_proposals"
        }, async () => {
          const { data: pd } = await supabase
            .from('profiles')
            .select('swaps_viewed_at')
            .eq('id', user.id)
            .single()

          const { count: sc } = await supabase
            .from('swap_proposals')
            .select('*', { count: 'exact', head: true })
            .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .gt('updated_at', pd?.swaps_viewed_at || '1970-01-01T00:00:00Z')

          setUnreadSwapCount(sc || 0)
        })
        .subscribe()
    }

    init()

    return () => {
      notifChannel?.unsubscribe()
      messageChannel?.unsubscribe()
      swapChannel?.unsubscribe()
    }
  }, [])

  const handleCreateClick = async (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      // Show a brief toast-style message, then redirect
      const toastMsg = tAuth('signInToCreate')
      // Use a native-style alert-free approach: redirect directly with message
      router.push(`/auth?redirect=/create&message=${encodeURIComponent(toastMsg)}`)
    }
  }

  const tabs = [
    { key: 'home', label: t('home'), icon: Home, href: "/" },
    { key: 'notifications', label: t('notifications'), icon: Bell, href: "/notifications" },
    { key: 'create', label: t('create'), icon: Plus, href: "/create", center: true },
    { key: 'chats', label: t('chats'), icon: MessageCircle, href: "/chats" },
    { key: 'profile', label: t('profile'), icon: User, href: "/profile" },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-card shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex max-w-[390px] items-center justify-around px-4 py-2 pb-[calc(env(safe-area-inset-bottom,8px)+6px)]">
        {tabs.map(({ key, label, icon: Icon, href, center }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)

          if (center) {
            return (
              <Link
                key={key}
                href={href}
                aria-label={label}
                onClick={handleCreateClick}
                className="-mt-1 flex h-[52px] w-[60px] items-center justify-center rounded-full bg-brand-gradient shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-90"
              >
                <Icon className="h-6 w-6 text-primary-foreground" />
              </Link>
            )
          }

          return (
            <Link
              key={key}
              href={href}
              className="flex flex-col items-center gap-1 px-2 py-1 transition-transform active:scale-95"
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5"
                  fill={active ? "var(--primary)" : "none"}
                  color={active ? "var(--primary)" : "var(--muted-foreground)"}
                />
                {key === "notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                )}
                {key === "chats" && unreadMessageCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                )}
                {key === "profile" && unreadSwapCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
