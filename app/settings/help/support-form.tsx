'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { sendSupportEmail } from '@/app/actions/support'

export function SupportForm({ userEmail, userName }: { userEmail: string; userName: string }) {
  const t = useTranslations('Help')
  
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const subjects = [
    { value: 'bug_report', label: t('bugReport') },
    { value: 'account_issue', label: t('accountIssue') },
    { value: 'swap_problem', label: t('swapProblem') },
    { value: 'payment_issue', label: t('paymentIssue') },
    { value: 'other', label: t('other') }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    


    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const res = await sendSupportEmail({
        subject: subjects.find(s => s.value === subject)?.label || subject,
        message,
        userEmail,
        userName
      })

      if (res?.error) {
        setStatus('error')
        setErrorMsg(res.error)
        return
      }

      setStatus('success')
      setSubject('')
      setMessage('')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || t('errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      {status === 'success' ? (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {t('successMessage')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              {t('subject')}
            </label>
            <div className="relative">
              <select
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="" disabled>
                  {t('subject')}...
                </option>
                {subjects.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              {t('message')}
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('describeIssue')}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {status === 'error' && (
            <p className="text-sm font-medium text-destructive ml-1">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !subject || !message}
            className="mt-2 flex w-full items-center justify-center rounded-full bg-foreground px-4 py-3.5 text-sm font-bold text-background transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '...' : t('sendMessage')}
          </button>
        </>
      )}
    </form>
  )
}
