import { createServerClient } from '@/lib/supabase/server'
import type { Conversation, Message } from '@/lib/types'
import { getBlockedUsers } from './blocks'

export async function getUserConversations(): Promise<Conversation[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listing_id(*),
      partner:profiles!participant_a(*),
      partner2:profiles!participant_b(*),
      messages!inner(
        id,
        sender_id,
        text,
        message_type,
        created_at,
        read_at,
        deleted_at,
        deleted_for
      )
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  if (error) return []

  // Get blocked users to filter out conversations with them
  const blockedUsers = await getBlockedUsers(user.id)
  const blockedIds = blockedUsers.map(u => u.id)

  // Simplify the partner join, filter out self-chats and blocked users, and calculate unread count
  const validConvs = (data as any[]).filter(conv => {
    const partnerId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
    return conv.participant_a !== conv.participant_b && !blockedIds.includes(partnerId)
  })
  
  // Deduplicate by partnerId (keep the first one since they are ordered by last_message_at DESC)
  const uniqueConvsMap = new Map()
  for (const conv of validConvs) {
    const partnerId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
    if (!uniqueConvsMap.has(partnerId)) {
      uniqueConvsMap.set(partnerId, conv)
    }
  }
  
  const uniqueConvs = Array.from(uniqueConvsMap.values())
  
  return uniqueConvs.map(conv => {
    const partner = conv.participant_a === user.id ? conv.partner2 : conv.partner
    
    // Filter visible messages
    let visibleMessages = (conv.messages || []).filter(
      (m: any) => !m.deleted_at && !(m.deleted_for ?? []).includes(user.id)
    )
    
    // Sort to find the latest
    visibleMessages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const lastVisibleMsg = visibleMessages[visibleMessages.length - 1]

    // Count unread messages (messages from other user that haven't been read)
    const unreadCount = visibleMessages.filter(
      (m: any) => m.sender_id !== user.id && !m.read_at
    ).length

    return {
      ...conv,
      partner,
      last_message: lastVisibleMsg ? (lastVisibleMsg.message_type === 'image' ? 'Sent an image' : lastVisibleMsg.text) : conv.last_message,
      last_message_at: lastVisibleMsg ? lastVisibleMsg.created_at : conv.last_message_at,
      unread_count: unreadCount,
      messages: undefined // Don't include messages in the returned conversation
    }
  }) as Conversation[]
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data as Message[]
}

export async function getConversationWithUser(otherUserId: string): Promise<Conversation | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(participant_a.eq.${user.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user.id})`)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as Conversation
}
