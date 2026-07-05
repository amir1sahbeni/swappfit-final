"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'

export function EditProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations('EditProfile')
  const router = useRouter()
  const [name, setName] = useState(profile.name || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [location, setLocation] = useState(profile.location || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(profile.avatar_url || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      let finalAvatarUrl = avatarUrl

      // Upload image if changed
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })
          
        if (uploadError) throw uploadError
        
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
          
        finalAvatarUrl = publicUrlData.publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          bio,
          location,
          avatar_url: finalAvatarUrl
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      router.replace('/profile')
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('failedToUpdate'))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <PageHeader title={t('title')} />

      <div className="mt-8 flex flex-col items-center">
        <div className="relative">
          <img
            src={previewUrl || '/placeholder.svg'}
            alt={t('avatarPreview')}
            className="h-24 w-24 rounded-full object-cover border border-border"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md active:scale-95 transition-transform"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('location')}</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('placeholderLocation')}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder={t('placeholderBio')}
            className="w-full resize-none rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>
        
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Submit */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
        <button
          disabled={!name.trim() || isSubmitting}
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {t('saveChanges')}
            </>
          )}
        </button>
      </div>
    </main>
  )
}
