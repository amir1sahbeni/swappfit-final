'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('blocks')
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    })

  revalidatePath('/')
  return !error
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)

  revalidatePath('/settings/privacy/blocked-users')
  return !error
}
