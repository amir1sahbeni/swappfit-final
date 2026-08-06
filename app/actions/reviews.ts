'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect, RedirectType } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from '@/lib/webpush'

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

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await supabase
      .from('profiles')
      .update({
        rating: Math.round(avg * 10) / 10,
        review_count: allReviews.length
      })
      .eq('id', data.revieweeId)
  }

  // Notification
  await supabase.from('notifications').insert({
    user_id: data.revieweeId,
    type: 'rating',
    actor_id: user.id,
    entity_id: data.proposalId,
    text: JSON.stringify({ rating: data.rating }),
    read: false,
  })

  // Push notification
  const { data: reviewerProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const reviewerName = reviewerProfile?.name || 'Someone'
  await sendPushToUser(supabase, data.revieweeId, reviewerName, `${reviewerName} gave you a ${data.rating} star review`, `/profile`)

  revalidatePath(`/user/${data.revieweeId}`)
  revalidatePath('/profile')
  redirect('/profile', RedirectType.replace)
}
