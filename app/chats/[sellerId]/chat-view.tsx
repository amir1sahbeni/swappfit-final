"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Send, Loader2, Reply, Smile, Trash2, Copy, AlertTriangle, X, Camera, Image as ImageIcon, Heart } from "lucide-react"
import type { Profile, Message } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { UserAvatar } from "@/components/user-avatar"
import { formatMessageTime, storageUrl, getTimeAgo } from "@/lib/utils"
import { compressImage } from "@/lib/utils/compressImage"
import { sendPushNotification } from "@/lib/push-notifications"
import { useTranslations } from 'next-intl'

const formatClusterTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

export function ChatView({ 
  partner, 
  currentUserId, 
  conversationId, 
  initialMessages,
  hasNewListing = false,
  initialText = ""
}: { 
  partner: Profile, 
  currentUserId: string, 
  conversationId: string | undefined, 
  initialMessages: Message[],
  hasNewListing?: boolean,
  initialText?: string
}) {
  const t = useTranslations('ChatView')
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState(initialText)
  const [isSending, setIsSending] = useState(false)
  const [activeMessage, setActiveMessage] = useState<Message | null>(null)
  const [activeMessagePosition, setActiveMessagePosition] = useState<'top' | 'bottom'>('top')
  const [toggledMessageId, setToggledMessageId] = useState<string | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const isPressing = useRef(false)
  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat_${conversationId}_${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message
          if (newMessage.sender_id !== currentUserId) {
            setMessages(prev => [...prev, newMessage])
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m))
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, currentUserId, supabase])

  // Scroll to bottom - useLayoutEffect for initial load to prevent visible scroll animation
  useLayoutEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: isInitialLoad ? "auto" : "smooth" })
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
    }
  }, [messages, isInitialLoad])

  // Mark messages as read when viewing the chat
  useEffect(() => {
    if (!conversationId) return

    const markAsRead = async () => {
      // Mark all unread messages from the other user as read
      const unreadMessages = messages.filter(
        m => m.sender_id !== currentUserId && !m.read_at
      )

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id))
      }
    }

    markAsRead()
  }, [conversationId, messages, currentUserId, supabase])

  const handlePointerDown = (msg: Message, e: React.PointerEvent) => {
    // Only react to primary pointer (left click / touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    isPressing.current = true
    pressTimer.current = setTimeout(() => {
      isPressing.current = false
      setActiveMessagePosition(centerY > window.innerHeight / 2 ? 'bottom' : 'top')
      setActiveMessage(msg)
    }, 400)
  }

  const handlePointerUp = (msg: Message) => {
    if (pressTimer.current && isPressing.current) {
      clearTimeout(pressTimer.current)
      isPressing.current = false
      // It was a short tap
      if (!activeMessage) {
        setToggledMessageId(prev => prev === msg.id ? null : msg.id)
      }
    }
  }

  const handlePointerMove = () => {
    if (pressTimer.current && isPressing.current) {
      clearTimeout(pressTimer.current)
      isPressing.current = false
    }
  }

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault()
    const content = (overrideText || text).trim()
    if (!content || isSending || isUploading) return

    setIsSending(true)
    const currentReplyId = replyingTo?.id
    if (!overrideText) setText("")
    setReplyingTo(null)

    try {
      let activeConvId = conversationId
      
      if (!activeConvId) {
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            participant_a: currentUserId,
            participant_b: partner.id,
            last_message: content,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()
          
        if (convErr) throw convErr
        activeConvId = conv.id
        
        router.refresh()
      } else {
        await supabase
          .from('conversations')
          .update({ last_message: content, last_message_at: new Date().toISOString() })
          .eq('id', activeConvId)
      }

      const msgPayload: Record<string, unknown> = {
        conversation_id: activeConvId,
        sender_id: currentUserId,
        text: content,
      }
      // Only include reply_to_message_id when actually replying;
      // passing undefined/null can cause FK validation errors on some Supabase versions.
      if (currentReplyId) {
        msgPayload.reply_to_message_id = currentReplyId
      }

      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .insert(msgPayload)
        .select('*')
        .single()

      if (msgErr) throw msgErr

      setMessages(prev => [...prev, msg as Message])

      // Send push notification (stub - requires native app setup)
      await sendPushNotification({
        recipientId: partner.id,
        title: `New message from ${partner.name}`,
        body: content.length > 100 ? content.substring(0, 100) + '...' : content,
        data: {
          conversationId: activeConvId,
          messageId: msg.id,
          senderId: currentUserId
        }
      })

    } catch (err: any) {
      // PostgrestError properties are non-enumerable so console.error(err) shows {}.
      // Log the real fields explicitly.
      console.error('handleSend error:', err?.message ?? err, '| code:', err?.code, '| details:', err?.details)
    } finally {
      setIsSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const compressed = await compressImage(file, 1000, 1000, 0.7)
      const fileName = `${currentUserId}_${Date.now()}.jpg`
      const { error: uploadErr } = await supabase.storage.from('item-images').upload(fileName, compressed, {
        contentType: 'image/jpeg',
      })
      if (uploadErr) throw uploadErr
      
      const mediaUrl = storageUrl('item-images', fileName)

      let activeConvId = conversationId
      if (!activeConvId) {
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            participant_a: currentUserId,
            participant_b: partner.id,
            last_message: "Sent an image",
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()
          
        if (convErr) throw convErr
        activeConvId = conv.id
        router.refresh()
      } else {
        await supabase
          .from('conversations')
          .update({ last_message: "Sent an image", last_message_at: new Date().toISOString() })
          .eq('id', activeConvId)
      }

      const imgPayload: Record<string, unknown> = {
        conversation_id: activeConvId,
        sender_id: currentUserId,
        text: "",
        message_type: 'image',
        media_url: mediaUrl,
      }
      if (replyingTo?.id) {
        imgPayload.reply_to_message_id = replyingTo.id
      }

      const { data: msg, error: msgErr } = await supabase
        .from('messages')
        .insert(imgPayload)
        .select('*')
        .single()

      if (msgErr) throw msgErr

      setMessages(prev => [...prev, msg as Message])
      setReplyingTo(null)

      // Send push notification (stub - requires native app setup)
      await sendPushNotification({
        recipientId: partner.id,
        title: `New image from ${partner.name}`,
        body: 'Sent you an image',
        data: {
          conversationId: activeConvId,
          messageId: msg.id,
          senderId: currentUserId,
          messageType: 'image'
        }
      })
    } catch (err: any) {
      console.error('handleImageUpload error:', err?.message ?? err, '| code:', err?.code)
      alert(`${t('failedToUploadImage')}: ${err?.message ?? 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = '' 
    }
  }

  // Delete for me: single atomic UPDATE via RPC — no client-side read-modify-write race
  const handleDeleteForMe = async (msgId: string) => {
    setActiveMessage(null)
    try {
      const { error } = await supabase.rpc('message_delete_for_me', { msg_id: msgId })
      if (error) throw error
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, deleted_for: [...(m.deleted_for ?? []), currentUserId] }
            : m
        )
      )
    } catch (e) {
      console.error('Delete for me failed:', e)
    }
  }

  // Delete for everyone: sets deleted_at, hides message for all participants
  const handleDeleteForEveryone = async (msgId: string) => {
    setActiveMessage(null)
    try {
      await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId)
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m)
      )
    } catch (e) {
      console.error('Delete for everyone failed:', e)
    }
  }

  const handleReact = async (msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const reactions = { ...(msg.reactions || {}) }
    
    // If the user already reacted with this emoji, toggle it off
    // Otherwise set their reaction to this new emoji (replacing any previous one)
    if (reactions[currentUserId] === emoji) {
      delete reactions[currentUserId]
    } else {
      reactions[currentUserId] = emoji
    }

    try {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m))
      await supabase.from('messages').update({ reactions }).eq('id', msgId)
    } catch (e) {}
    setActiveMessage(null)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setActiveMessage(null)
  }

  const validMessages = messages.filter(m =>
    !m.deleted_at &&
    !(m.deleted_for ?? []).includes(currentUserId)
  )

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[390px] flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar 
            id={partner.id} 
            name={partner.name} 
            avatarUrl={partner.avatar_url} 
            hasNewListing={hasNewListing}
            className="h-10 w-10" 
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-foreground">{partner.name}</h1>
            <p className="truncate text-xs text-muted-foreground">{partner.handle}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 hide-scrollbar">
        {validMessages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId
          const prevMsg = validMessages[i - 1]
          const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id
          const showAvatar = !isMine && !isConsecutive
          const replyMsg = msg.reply_to_message_id ? validMessages.find(m => m.id === msg.reply_to_message_id) : null

          return (
            <div key={msg.id} id={`msg-${msg.id}`} className={`flex flex-col ${isMine ? "items-end" : "items-start"} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
              {/* Timestamp above first message in cluster */}
              {(i === 0 || new Date(msg.created_at).getTime() - new Date(validMessages[i - 1].created_at).getTime() > 5 * 60000) && (
                <div className="my-2 text-center text-[10px] font-medium text-muted-foreground w-full">
                  {formatClusterTime(msg.created_at)}
                </div>
              )}
              <div className={`flex gap-2 max-w-[80%] relative ${activeMessage?.id === msg.id ? 'z-[60]' : 'z-10'}`}>
                {!isMine && (
                  <div className="w-8 shrink-0 flex items-end">
                    {showAvatar && (
                      <UserAvatar 
                        id={partner.id} 
                        name={partner.name} 
                        avatarUrl={partner.avatar_url} 
                        hasNewListing={hasNewListing}
                        className="h-8 w-8" 
                      />
                    )}
                  </div>
                )}
                <div 
                  onContextMenu={(e) => { 
                    e.preventDefault(); 
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setActiveMessagePosition(rect.top + rect.height / 2 > window.innerHeight / 2 ? 'bottom' : 'top');
                    setActiveMessage(msg); 
                  }}
                  onPointerDown={(e) => handlePointerDown(msg, e)}
                  onPointerUp={() => handlePointerUp(msg)}
                  onPointerMove={handlePointerMove}
                  onPointerCancel={handlePointerMove}
                  className={`flex flex-col cursor-pointer relative transition-all duration-200 ${activeMessage?.id === msg.id ? 'scale-[1.02] drop-shadow-2xl z-[60]' : ''}`}
                >
                  {activeMessage?.id === msg.id && (
                    <div className={`absolute ${activeMessagePosition === 'bottom' ? '-top-14' : '-bottom-14'} ${isMine ? 'right-0' : 'left-0'} bg-card border border-border shadow-xl rounded-full px-3 py-2 flex gap-3 z-[70] animate-in zoom-in-95 fade-in duration-200`}>
                      {['👍', '❤️', '😂', '😮', '😢', '😠'].map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); }}
                          className="text-2xl hover:scale-125 transition-transform origin-bottom"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {showAvatar && (
                    <span className="text-[11px] text-muted-foreground ml-1 mb-1">{partner.name}</span>
                  )}

                  {/* Facebook-style reply shadow — shows the message being replied to above the reply */}
                  {replyMsg && (
                    <div
                      onClick={() => {
                        const originalMsgElement = document.getElementById(`msg-${replyMsg.id}`)
                        if (originalMsgElement) {
                          originalMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          originalMsgElement.classList.add('ring-2', 'ring-primary')
                          setTimeout(() => {
                            originalMsgElement.classList.remove('ring-2', 'ring-primary')
                          }, 2000)
                        }
                      }}
                      className={`scale-95 origin-top cursor-pointer ${
                        isMine ? 'self-end' : 'self-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl text-sm relative opacity-40 ${
                          isMine
                            ? "rounded-br-sm bg-brand-gradient text-white shadow-[0_4px_12px_rgba(192,57,91,0.2)]"
                            : "rounded-bl-sm bg-muted text-foreground"
                        } px-3 py-2`}
                      >
                        {replyMsg.message_type === 'image' && replyMsg.media_url ? (
                          <img src={replyMsg.media_url} alt="Replied image" className="max-w-[180px] w-full rounded-xl object-cover opacity-60" />
                        ) : (
                          <p className="line-clamp-3 text-xs break-words">{replyMsg.text}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl text-sm relative ${
                      isMine
                        ? "rounded-br-sm bg-brand-gradient text-white shadow-[0_4px_12px_rgba(192,57,91,0.2)]"
                        : "rounded-bl-sm bg-muted text-foreground"
                    } ${msg.message_type === 'image' ? 'p-1' : 'px-4 py-2.5'}`}
                  >
                    {msg.message_type === 'image' && msg.media_url ? (
                      <img 
                        src={msg.media_url} 
                        alt="Attached image" 
                        className="max-w-[240px] w-full rounded-xl object-cover cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (activeMessage?.id !== msg.id) {
                            setViewingImage(msg.media_url!)
                          }
                        }}
                      />
                    ) : (
                      <span className="break-words">{msg.text}</span>
                    )}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="absolute -bottom-3 -right-2 bg-card border border-border rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1 z-10 text-foreground">
                        {Object.entries(
                          Object.entries(msg.reactions).reduce((acc: Record<string, number>, [k, v]) => {
                            if (typeof v === 'number') {
                              acc[k] = (acc[k] || 0) + v // Legacy format
                            } else if (typeof v === 'string') {
                              acc[v] = (acc[v] || 0) + 1 // New format (k=userId, v=emoji)
                            }
                            return acc
                          }, {})
                        ).map(([emoji, count]) => (
                          <span key={emoji}>{emoji} {count > 1 ? count : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {activeMessage?.id === msg.id && (
                    <div className={`absolute ${activeMessagePosition === 'bottom' ? 'bottom-full mb-16' : 'top-full mt-16'} ${isMine ? 'right-0' : 'left-0'} w-52 bg-card border border-border shadow-xl rounded-2xl flex flex-col overflow-hidden z-[70] animate-in zoom-in-95 fade-in duration-200`}>
                      {/* Reply */}
                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessage(null) }} className="flex items-center justify-between p-3 text-sm hover:bg-muted active:bg-muted transition-colors">
                        <span className="font-medium">{t('reply')}</span> <Reply className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="h-px w-full bg-border" />
                      {/* Copy */}
                      <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text) }} className="flex items-center justify-between p-3 text-sm hover:bg-muted active:bg-muted transition-colors">
                        <span className="font-medium">{t('copyText')}</span> <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="h-px w-full bg-border" />
                      {/* Delete for me — always available on any message */}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteForMe(msg.id) }} className="flex items-center justify-between p-3 text-sm hover:bg-muted active:bg-muted transition-colors">
                        <span className="font-medium text-foreground">{t('deleteForMe')}</span>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {/* Delete for everyone — only sender can do this */}
                      {isMine && (
                        <>
                          <div className="h-px w-full bg-border" />
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteForEveryone(msg.id) }} className="flex items-center justify-between p-3 text-sm text-destructive hover:bg-destructive/10 active:bg-destructive/10 transition-colors">
                            <span className="font-medium">{t('deleteForEveryone')}</span>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {/* Report — only for partner's messages */}
                      {!isMine && (
                        <>
                          <div className="h-px w-full bg-border" />
                          <button onClick={(e) => { e.stopPropagation(); alert(t('messageReported')); setActiveMessage(null) }} className="flex items-center justify-between p-3 text-sm text-destructive hover:bg-destructive/10 active:bg-destructive/10 transition-colors">
                            <span className="font-medium">{t('report')}</span> <AlertTriangle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {isMine && (i === validMessages.length - 1 || toggledMessageId === msg.id) && !activeMessage && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 text-right animate-in fade-in slide-in-from-top-1">
                      {msg.read_at ? `${t('seen')} ${getTimeAgo(msg.read_at)}` : `${t('sent')} ${getTimeAgo(msg.created_at)}`}
                    </div>
                  )}
                  {!isMine && toggledMessageId === msg.id && !activeMessage && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 animate-in fade-in slide-in-from-top-1 text-left">
                      {formatMessageTime(msg.created_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom,8px)+16px)] flex flex-col gap-2">
        {replyingTo && (
          <div className="flex items-center justify-between rounded-xl bg-muted p-2 border-l-2 border-primary text-sm">
            <div className="truncate text-muted-foreground">{t('replyingTo')} <span className="text-foreground">{replyingTo.message_type === 'image' ? t('anImage') : replyingTo.text}</span></div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2 relative">
          <div className="flex shrink-0 gap-1 pb-1">
            <button
              type="button"
              disabled={isUploading || isSending}
              onClick={() => galleryRef.current?.click()}
              className="p-2 text-brand hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            >
              <ImageIcon className="h-6 w-6" />
            </button>
          </div>
          
          <input type="file" ref={galleryRef} accept="image/*" className="hidden" onChange={handleImageUpload} />

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('typeAMessage')}
            className="w-full rounded-2xl bg-muted px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as any)
              }
            }}
          />
          <button
            type="submit"
            disabled={isSending || isUploading || text.trim().length === 0}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>

      {/* Background Overlay for Long Press */}
      {activeMessage && (
        <div 
          className="fixed inset-0 z-[50] bg-background/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveMessage(null)}
          onPointerDown={() => setActiveMessage(null)}
        />
      )}

      {/* Full screen image viewer */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-[env(safe-area-inset-top,20px)] right-4 mt-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-[60]"
            onClick={(e) => {
              e.stopPropagation()
              setViewingImage(null)
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-center p-0 w-full h-full" onClick={() => setViewingImage(null)}>
            <img 
              src={viewingImage} 
              alt="Full screen" 
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </main>
  )
}
