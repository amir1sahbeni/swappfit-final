"use client"

import { MapPin, Star } from "lucide-react"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { Profile } from "@/lib/types"

export function ProfileCard({ profile, followStats }: { profile: Profile; followStats: { followers: number; following: number } }) {

  const router = useRouter()
  const t = useTranslations('ProfileCard')

  return (
    <div className="flex flex-col items-center rounded-3xl bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-2 relative">

      <img 
        src={profile.avatar_url || '/placeholder.svg'} 
        alt={profile.name} 
        className="h-24 w-24 rounded-full object-cover no-rtl-flip" 
      />
      <h2 className="mt-4 text-xl font-bold text-foreground">{profile.name}</h2>
      <p className="text-sm text-muted-foreground">@{profile.handle?.replace('@', '') || profile.handle}</p>
      
      <p className="mt-4 text-center text-[15px] text-foreground leading-relaxed px-2">
        {profile.bio || t('noBio')}
      </p>
      
      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {profile.location || t('locationNotSet')}
      </p>

      {/* Stats Pill */}
      <div className="mt-6 flex w-full items-center justify-between rounded-[24px] bg-muted py-4 px-2">
        <div 
          onClick={() => router.push('/profile/followers')}
          className="flex flex-1 flex-col items-center border-r border-border cursor-pointer transition-transform active:scale-95"
        >
          <p className="text-lg font-bold text-foreground">{followStats.followers}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('followers')}</p>
        </div>
        <div 
          onClick={() => router.push('/profile/following')}
          className="flex flex-1 flex-col items-center border-r border-border cursor-pointer transition-transform active:scale-95"
        >
          <p className="text-lg font-bold text-foreground">{followStats.following}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('following')}</p>
        </div>
        <div className="flex flex-1 flex-col items-center border-r border-border">
          <p className="text-lg font-bold text-foreground">{profile.swap_count}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('swaps')}</p>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <p className="flex items-center gap-1 text-lg font-bold text-foreground">
            <Star className="h-4 w-4 text-primary" fill="currentColor" /> {profile.rating}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('rating')}</p>
        </div>
      </div>

      <button 
        onClick={() => router.push('/profile/edit')}
        className="mt-5 w-full rounded-2xl bg-muted py-4 text-sm font-bold text-foreground transition-transform active:scale-95"
      >
        {t('editProfile')}
      </button>
    </div>
  )
}
