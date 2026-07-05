"use client"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Moon, Bell, Globe, Lock, CreditCard, Shield, HelpCircle, LogOut, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { useTheme } from 'next-themes'
import { useAppContext } from '@/components/app-context'
import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { language } = useAppContext()
  const [locationError, setLocationError] = useState('')

  const languageLabel = language === 'en' ? t('english') : language === 'fr' ? t('french') : t('arabic')

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setProfile(data as Profile)
        })
      } else {
        router.replace('/auth')
      }
    })
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  const handleLocationToggle = async (enabled: boolean) => {
    setLocationError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (enabled) {
      // Request geolocation permission
      if (!navigator.geolocation) {
        setLocationError(t('geolocationNotSupported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const { error } = await supabase
            .from('profiles')
            .update({
              location_sharing_enabled: true,
              precise_lat: latitude,
              precise_lng: longitude
            })
            .eq('id', user.id)

          if (error) {
            setLocationError(t('failedToUpdateLocation'))
          } else if (profile) {
            setProfile({
              ...profile,
              location_sharing_enabled: true,
              precise_lat: latitude,
              precise_lng: longitude
            })
          }
        },
        (error) => {
          setLocationError(t('locationAccessDenied'))
          // Set to false on denial
          supabase
            .from('profiles')
            .update({ location_sharing_enabled: false })
            .eq('id', user.id)
        }
      )
    } else {
      // Turn off location sharing
      const { error } = await supabase
        .from('profiles')
        .update({
          location_sharing_enabled: false,
          precise_lat: null,
          precise_lng: null
        })
        .eq('id', user.id)

      if (error) {
        setLocationError(t('failedToUpdateLocation'))
      } else if (profile) {
        setProfile({
          ...profile,
          location_sharing_enabled: false,
          precise_lat: null,
          precise_lng: null
        })
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background pb-28">
      {/* Header */}
      <header className="flex h-[100px] items-center px-5 pt-8 bg-card border-b border-border">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-transform active:scale-95">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="ml-4 text-[22px] font-bold text-foreground">{t('title')}</h1>
      </header>

      <div className="px-5 mt-6 flex flex-col gap-8">
        {/* Profile Card */}
        <div 
          onClick={() => router.push('/profile/edit')}
          className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <img 
              src={profile?.avatar_url || '/placeholder.svg'} 
              alt={profile?.name || ''} 
              className="h-14 w-14 rounded-full object-cover" 
            />
            <div>
              <p className="text-[15px] font-bold text-foreground">{profile?.name || t('loading')}</p>
              <p className="text-sm text-muted-foreground">@{profile?.handle?.replace('@', '') || profile?.handle}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Preferences */}
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('preferences')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Moon className="h-[22px] w-[22px] text-primary" />
                <span className="text-[15px] font-medium text-foreground">{t('darkMode')}</span>
              </div>
              {mounted && (
                <div className={`flex h-[26px] w-[46px] items-center rounded-full p-[3px] transition-colors ${theme === 'dark' ? 'bg-primary justify-end' : 'bg-border'}`}>
                  <div className="h-5 w-5 rounded-full bg-card shadow-sm" />
                </div>
              )}
            </div>
            <div
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <MapPin className="h-[22px] w-[22px] text-primary" />
                <div>
                  <span className="text-[15px] font-medium text-foreground">{t('shareLocation')}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t('shareLocationDesc')}</p>
                </div>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleLocationToggle(!profile?.location_sharing_enabled)
                }}
                className={`flex h-[26px] w-[46px] items-center rounded-full p-[3px] transition-colors shrink-0 ${profile?.location_sharing_enabled ? 'bg-primary justify-end' : 'bg-border'}`}
              >
                <div className="h-5 w-5 rounded-full bg-card shadow-sm" />
              </div>
            </div>
            {locationError && (
              <p className="mt-2 text-xs text-destructive">{locationError}</p>
            )}
            <div
              onClick={() => router.push('/settings/notifications')}
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Bell className="h-[22px] w-[22px] text-primary" />
                <span className="text-[15px] font-medium text-foreground">{t('pushNotifications')}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div
              onClick={() => router.push('/settings/language')}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Globe className="h-[22px] w-[22px] text-primary" />
                <span className="text-[15px] font-medium text-foreground">{t('language')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-muted-foreground">{languageLabel}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">{t('account')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => router.push('/settings/privacy')}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Lock className="h-[22px] w-[22px] text-primary" />
                <span className="text-[15px] font-medium text-foreground">{t('privacySecurity')}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">{t('support')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => router.push('/settings/help')}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <HelpCircle className="h-[22px] w-[22px] text-primary" />
                <span className="text-[15px] font-medium text-foreground">{t('helpCenter')}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>

        <button onClick={handleSignOut} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 text-[15px] font-bold text-destructive shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-[0.98]">
          <LogOut className="h-[20px] w-[20px]" />
          {t('logOut')}
        </button>
      </div>
    </main>
  )
}
