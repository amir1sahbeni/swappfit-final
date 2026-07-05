import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'


export async function getBlockedUsers(blockerId: string): Promise<Profile[]> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('blocks')
    .select(`
      blocked_id,
      profiles!blocks_blocked_id_fkey (
        id,
        name,
        handle,
        avatar_url,
        bio,
        location,
        rating,
        review_count,
        swap_count,
        created_at,
        updated_at
      )
    `)
    .eq('blocker_id', blockerId)

  if (error || !data) return []
  
  return data.map((block: any) => block.profiles as Profile)
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .single()

  return !error && data !== null
}
