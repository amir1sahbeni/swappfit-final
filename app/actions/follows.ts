'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendPushToUser } from '@/lib/webpush'

export async function toggleFollow(followingId: string, currentIsFollowing: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  try {
    if (currentIsFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: followingId })
        
      if (error) throw new Error(error.message)

      // Notify the followed user
      await supabase.from('notifications').insert({
        user_id: followingId,
        type: 'new_follower',
        actor_id: user.id,
        text: JSON.stringify({}),
        read: false
      })

      // Fetch follower name for push
      const { data: followerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const followerName = followerProfile?.name || 'Someone'
      await sendPushToUser(supabase, followingId, followerName, `${followerName} started following you`, `/user/${user.id}`)
    }
    
    revalidatePath(`/user/${followingId}`)
    revalidatePath('/profile')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}
