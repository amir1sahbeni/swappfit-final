import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { EditProfileForm } from './edit-profile-form'

export default async function EditProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/profile/edit')

  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/')

  return <EditProfileForm profile={profile} />
}
