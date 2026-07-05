"use client"

import { Check } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useAppContext, Language } from "@/components/app-context"
import { useTranslations } from 'next-intl'

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
]

export default function LanguageSettingsPage() {
  const t = useTranslations('Language')
  const { language, setLanguage } = useAppContext()

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        {languages.map((lang, idx) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex w-full items-center justify-between p-4 text-left transition-colors active:bg-muted/50 ${
                idx !== languages.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className={`text-[15px] font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                {lang.label}
              </span>
              {isActive && <Check className="h-5 w-5 text-primary" />}
            </button>
          )
        })}
      </div>
    </main>
  )
}
