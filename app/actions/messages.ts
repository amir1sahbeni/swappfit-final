'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/webpush'

export async function notifyNewMessage(recipientId: string, messagePreview: string, senderPath: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch sender's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const senderName = profile?.name || 'New message'
  await sendPushToUser(supabase, recipientId, senderName, messagePreview, senderPath)
}
