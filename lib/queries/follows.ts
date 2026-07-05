import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
  
  if (error) {
    console.error('Error following user:', error)
    return false
  }
  return true
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  
  if (error) {
    console.error('Error unfollowing user:', error)
    return false
  }
  return true
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()
  
  return !!data && !error
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follower_id(*)')
    .eq('following_id', userId)

  if (error || !data) return []
  return data.map((d: any) => d.profiles) as Profile[]
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!following_id(*)')
    .eq('follower_id', userId)

  if (error || !data) return []
  return data.map((d: any) => d.profiles) as Profile[]
}

export async function getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
  const supabase = await createServerClient()
  const [followers, following] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
  ])
  
  return {
    followers: followers.count || 0,
    following: following.count || 0
  }
}

export async function getFollowedUsersWithRecentListings(userId: string): Promise<string[]> {
  const supabase = await createServerClient()
  
  const { data: following, error: followingError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    
  if (followingError || !following || following.length === 0) return []
  
  const followingIds = following.map((f: any) => f.following_id)
  
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('seller_id')
    .in('seller_id', followingIds)
    .eq('status', 'active')
    .gte('created_at', fortyEightHoursAgo)
    
  if (listingsError || !listings) return []
  
  const uniqueIds = new Set(listings.map((l: any) => l.seller_id))
  return Array.from(uniqueIds)
}
