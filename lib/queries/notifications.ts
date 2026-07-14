import { createServerClient } from '@/lib/supabase/server'
import type { Notification } from '@/lib/types'

export async function getUserNotifications(): Promise<Notification[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, user_id, actor_id, type, entity_id, read, created_at,
      actor:profiles!actor_id(id, name, handle, avatar_url, is_premium)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data as Notification[]
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createServerClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    
  if (error) return 0
  return count || 0
}
