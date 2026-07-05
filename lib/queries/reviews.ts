import { createServerClient } from '@/lib/supabase/server'
import type { Review } from '@/lib/types'

export async function getUserReviews(userId: string): Promise<Review[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id(*)
    `)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Review[]
}
