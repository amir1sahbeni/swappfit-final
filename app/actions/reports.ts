'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function reportUser(reportedId: string, reason: string, details?: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_id: reportedId,
      reason,
      details: details || null,
    })

  if (error) throw new Error(error.message)
}
