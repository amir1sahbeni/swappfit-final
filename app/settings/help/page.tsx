"use client"

import { useState, useEffect } from "react"
import { ChevronDown, MessageSquare } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'

export default function HelpCenterPage() {
  const t = useTranslations('Help')
  const faqs = [
    {
      question: t('howSwappingWorks'),
      answer: t('howSwappingWorksAnswer'),
    },
    {
      question: t('accountSecurity'),
      answer: t('accountSecurityAnswer'),
    },
    {
      question: t('safetyTips'),
      answer: t('safetyTipsAnswer'),
    },
    {
      question: t('howToReport'),
      answer: t('howToReportAnswer'),
    },
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, handle')
          .eq('id', user.id)
          .single()
        if (profile) {
          setUserName(profile.name || profile.handle || "")
        }
      }
    }
    getUserInfo()
  }, [supabase])

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleContactSupport = () => {
    const subject = encodeURIComponent(t('supportRequest'))
    const body = encodeURIComponent(
      `${t('user')}: ${userName || t('unknown')} (${userEmail || t('noEmail')})\n\n${t('describeIssue')}\n\n`
    )
    window.location.href = `mailto:support@swappfit.me?subject=${subject}&body=${body}`
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-6 flex flex-col gap-6">
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('faq')}</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border-b border-border last:border-b-0`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors active:bg-muted/50"
                >
                  <span className="text-[15px] font-medium text-foreground">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${openIndex === index ? "rotate-180" : ""}`} />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 pt-1 animate-fade-in-up">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t('stillNeedHelp')}</p>
          <button
            onClick={handleContactSupport}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-muted py-3.5 text-[15px] font-semibold text-foreground transition-transform active:scale-95"
          >
            <MessageSquare className="h-5 w-5 text-primary" />
            {t('contactSupport')}
          </button>
        </section>
      </div>
    </main>
  )
}
