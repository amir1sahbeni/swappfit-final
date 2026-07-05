"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatMessageTime } from "@/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { useTranslations } from "next-intl"
import type { Conversation } from "@/lib/types"
import { Trash2, X } from "lucide-react"

export function ChatsList({ 
  initialConversations, 
  recentSellers 
}: { 
  initialConversations: Conversation[]
  recentSellers: string[]
}) {
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const t = useTranslations('Chats')
  const supabase = createClient()
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const isPressing = useRef(false)

  // Helper: fetch and normalize conversations for the current user
  const refreshConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        partner:profiles!participant_a(*),
        partner2:profiles!participant_b(*),
        messages (id, sender_id, text, message_type, created_at, read_at, deleted_at, deleted_for)
      `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (!data) return

    const validConvs = (data as any[]).filter(conv =>
      conv.participant_a !== conv.participant_b &&
      !(conv.deleted_for ?? []).includes(user.id)
    )

    const uniqueConvsMap = new Map()
    for (const conv of validConvs) {
      const partnerId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
      if (!uniqueConvsMap.has(partnerId)) {
        uniqueConvsMap.set(partnerId, conv)
      }
    }
    const uniqueConvs = Array.from(uniqueConvsMap.values())

    setConversations(uniqueConvs.map(conv => {
      const partner = conv.participant_a === user.id ? conv.partner2 : conv.partner
      let visibleMessages = (conv.messages || []).filter(
        (m: any) => !m.deleted_at && !(m.deleted_for ?? []).includes(user.id)
      )
      visibleMessages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const lastVisibleMsg = visibleMessages[visibleMessages.length - 1]
      const unreadCount = visibleMessages.filter(
        (m: any) => m.sender_id !== user.id && !m.read_at
      ).length

      return {
        ...conv,
        partner,
        last_message: lastVisibleMsg
          ? (lastVisibleMsg.message_type === 'image' ? t('sentAnImage') : lastVisibleMsg.text)
          : conv.last_message,
        last_message_at: lastVisibleMsg ? lastVisibleMsg.created_at : conv.last_message_at,
        unread_count: unreadCount,
        messages: undefined
      }
    }) as Conversation[])
  }

  useEffect(() => {
    // Unique channel name prevents stale subscription errors on remount
    const channel = supabase
      .channel(`conversations_changes_${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        refreshConversations()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePointerDown = (conv: Conversation, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    isPressing.current = true
    pressTimer.current = setTimeout(() => {
      isPressing.current = false
      setActiveConv(conv)
    }, 400)
  }

  const handlePointerUp = (conv: Conversation, partnerId: string) => {
    if (pressTimer.current && isPressing.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
      isPressing.current = false
      if (!activeConv) {
        router.push(`/chats/${partnerId}`)
      }
    }
  }

  const handlePointerMove = () => {
    if (pressTimer.current && isPressing.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
      isPressing.current = false
    }
  }

  const handleDismiss = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    isPressing.current = false
    setActiveConv(null)
  }

  const handleDeleteConversation = async (conv: Conversation) => {
    handleDismiss()
    setIsDeletingId(conv.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsDeletingId(null); return }

    // Optimistic removal — remove from view immediately
    setConversations(prev => prev.filter(c => c.id !== conv.id))

    // Persist "deleted for me" on the server
    const { error } = await supabase
      .from('conversations')
      .update({ deleted_for: [...(conv.deleted_for || []), user.id] })
      .eq('id', conv.id)

    if (error) {
      console.error('Failed to delete chat:', error.message)
      // Rollback optimistic removal on failure
      setConversations(prev => [conv, ...prev])
    }

    setIsDeletingId(null)
  }

  if (conversations.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">{t('noMessages')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 flex flex-col">
        {[...conversations].sort((a, b) => {
          const aUnread = (a.unread_count || 0) > 0;
          const bUnread = (b.unread_count || 0) > 0;
          if (aUnread && !bUnread) return -1;
          if (!aUnread && bUnread) return 1;
          return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
        }).map((conv) => {
          const partner = conv.partner
          if (!partner) return null
          const hasNewListing = recentSellers.includes(partner.id)
          const unreadCount = conv.unread_count || 0
          const hasUnread = unreadCount > 0
          const isActive = activeConv?.id === conv.id
          const isDeleting = isDeletingId === conv.id

          return (
            <div key={conv.id} className="relative">
              {/* Chat row — highlighted on long press */}
              <div
                className={`flex items-center gap-4 border-b border-border py-4 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-card rounded-2xl px-3 shadow-[0_4px_20px_rgba(192,57,91,0.08)] ring-2 ring-primary/20 scale-[1.01] z-[60]'
                    : 'z-10 active:scale-[0.98]'
                } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                onPointerDown={(e) => handlePointerDown(conv, e)}
                onPointerUp={() => handlePointerUp(conv, partner.id)}
                onPointerMove={handlePointerMove}
                onPointerCancel={handlePointerMove}
              >
                <UserAvatar
                  id={partner.id}
                  name={partner.name}
                  avatarUrl={partner.avatar_url}
                  hasNewListing={hasNewListing}
                  className="h-14 w-14"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-foreground ${hasUnread ? 'font-bold' : 'font-normal'}`}>
                      {partner.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {formatMessageTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={`mt-0.5 truncate text-sm ${hasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground opacity-80'}`}>
                    {hasUnread
                      ? `${unreadCount} ${unreadCount > 1 ? t('newMessages') : t('newMessage')}`
                      : (conv.last_message || t('startedConversation'))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Long-press action: Delete bottom sheet (inline) */}
              {isActive && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-[70] animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="rounded-2xl bg-card border border-border shadow-[0_8px_32px_rgba(192,57,91,0.10)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-sm font-bold text-foreground">{partner.name}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss() }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {/* Delete action */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv) }}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-destructive/5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-destructive">{t('deleteForMe')}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 whitespace-pre-line">
                          {t('deleteForMeDescription', { name: partner.name })}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Background Overlay for Long Press */}
      {activeConv && (
        <div
          className="fixed inset-0 z-[50] bg-background/70 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={handleDismiss}
          onPointerDown={handleDismiss}
        />
      )}
    </>
  )
}
