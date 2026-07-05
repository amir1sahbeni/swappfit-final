import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as Profile
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let profile = await getProfile(user.id)
  
  // Self-heal: if user exists in auth but missing in public.profiles
  if (!profile) {
    const baseHandle = '@' + (user.email?.split('@')[0] || 'user').replace(/[^a-z0-9]/g, '')
    const finalHandle = baseHandle + user.id.substring(0, 4)
    
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        handle: finalHandle,
      })
      .select('*')
      .single()
      
    if (!error && newProfile) {
      profile = newProfile as Profile
    }
  }

  return profile
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createServerClient()
  
  if (!query.trim()) return []
  
  const searchTerm = query.trim()
  
  // Search by handle (username) or name (display name), case insensitive, partial match
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`handle.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []
  
  return data as Profile[]
}
