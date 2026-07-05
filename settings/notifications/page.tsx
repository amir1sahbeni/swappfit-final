"use client"

import { PageHeader } from "@/components/page-header"
import { useAppContext } from "@/components/app-context"
import { useTranslations } from 'next-intl'

export default function NotificationsSettingsPage() {
  const t = useTranslations('Notifications')
  const { notificationSettings, setNotificationSettings } = useAppContext()
  const { muteAll, newMessages, swapProposals, itemLikes, swapAccepted, newReviews } = notificationSettings

  const updateSetting = (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-6 flex flex-col gap-8">
        <section>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => updateSetting('muteAll', !muteAll)}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-bold text-foreground">{t('muteAll')}</span>
              <Toggle on={muteAll} />
            </div>
          </div>
        </section>

        <section className={muteAll ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">{t('messagesActivity')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => updateSetting('newMessages', !newMessages)}
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-medium text-foreground">{t('newMessages')}</span>
              <Toggle on={newMessages} />
            </div>
            <div
              onClick={() => updateSetting('itemLikes', !itemLikes)}
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-medium text-foreground">{t('itemLikes')}</span>
              <Toggle on={itemLikes} />
            </div>
            <div
              onClick={() => updateSetting('newReviews', !newReviews)}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-medium text-foreground">{t('newReviews')}</span>
              <Toggle on={newReviews} />
            </div>
          </div>
        </section>

        <section className={muteAll ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">{t('swaps')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => updateSetting('swapProposals', !swapProposals)}
              className="flex items-center justify-between border-b border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-medium text-foreground">{t('swapProposals')}</span>
              <Toggle on={swapProposals} />
            </div>
            <div
              onClick={() => updateSetting('swapAccepted', !swapAccepted)}
              className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
            >
              <span className="text-[15px] font-medium text-foreground">{t('swapAccepted')}</span>
              <Toggle on={swapAccepted} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full p-[3px] transition-colors ${on ? "bg-primary" : "bg-switch-background"}`}
    >
      <span className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-card shadow-sm transition-transform ${on ? "translate-x-[20px]" : "translate-x-0"}`} />
    </button>
  )
}
