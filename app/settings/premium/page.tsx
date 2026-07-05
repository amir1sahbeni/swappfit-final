"use client"

import { Check, Star, Shield, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useAppContext } from "@/components/app-context"
import { useTranslations } from 'next-intl'

export default function PremiumPage() {
  const t = useTranslations('Premium')
  const { isPremium, setIsPremium } = useAppContext()

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {isPremium ? (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-card p-6 shadow-[0_8px_32px_rgba(192,57,91,0.10)] relative">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-5 items-center justify-center rounded-full bg-brand-gradient px-2 text-[11px] font-bold text-primary-foreground shadow-[0_4px_10px_rgba(192,57,91,0.2)]">
                {t('active')}
              </span>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Star className="h-6 w-6 text-primary" fill="currentColor" />
            </div>

            <h2 className="text-xl font-bold text-foreground">{t('swappFitPremium')}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t('premiumDescription')}
            </p>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm font-medium text-foreground mb-1">{t('currentPlan')}</p>
              <p className="text-sm text-muted-foreground">$9.99 / month</p>

              <button
                onClick={() => setIsPremium(false)}
                className="mt-6 w-full rounded-full border border-border bg-transparent py-3 text-sm font-semibold text-foreground transition-transform active:scale-95"
              >
                {t('cancelSubscription')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-card p-6 shadow-[0_8px_32px_rgba(192,57,91,0.10)] border border-primary/20">
            <div className="flex justify-center mb-4">
              <span className="inline-flex h-8 items-center justify-center rounded-full bg-primary/10 px-4">
                <Star className="h-4 w-4 text-primary mr-1" fill="currentColor" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{t('upgrade')}</span>
              </span>
            </div>

            <h2 className="text-2xl font-bold text-center text-foreground">{t('goPremium')}</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t('unlockExperience')}
            </p>

            <div className="my-8 flex justify-center">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-foreground">$9.99</span>
                <span className="text-sm text-muted-foreground ml-1">/ mo</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-foreground">{t('noAds')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-foreground">{t('unlimitedListings')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-foreground">{t('premiumBadge')}</p>
              </div>
            </div>

            <button
              onClick={() => setIsPremium(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95"
            >
              {t('upgradeNow')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
