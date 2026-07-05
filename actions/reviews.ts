'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect, RedirectType } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitReview(data: {
  revieweeId: string
  proposalId: string | null
  rating: number
  tags: string[]
  body: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Insert review
  const { error: revErr } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    reviewee_id: data.revieweeId,
    proposal_id: data.proposalId,
    rating: data.rating,
    tags: data.tags,
    body: data.body,
  })
  if (revErr) throw new Error(revErr.message)

  // Recompute reviewee aggregate rating
  const { data: allReviews, error: aggErr } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', data.revieweeId)
  if (aggErr) throw new Error(aggErr.message)

  const count = allReviews.length
  const avg = count > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0

  await supabase
    .from('profiles')
    .update({ rating: parseFloat(avg.toFixed(2)), review_count: count })
    .eq('id', data.revieweeId)

  // Notification
  await supabase.from('notifications').insert({
    user_id: data.revieweeId,
    type: 'rating',
    actor_id: user.id,
    entity_id: data.proposalId,
    text: `left you a ${data.rating}-star review`,
    read: false,
  })

  revalidatePath(`/user/${data.revieweeId}`)
  revalidatePath('/profile')
  redirect('/profile', RedirectType.replace)
}
