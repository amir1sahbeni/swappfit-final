"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star, Loader2 } from "lucide-react"
import type { Profile } from "@/lib/types"
import { submitReview } from "@/app/actions/reviews"
import { useTranslations } from 'next-intl'

export function RatingView({ proposalId, partner }: { proposalId: string, partner: Profile }) {
  const t = useTranslations('Rating')
  const TAGS = [t('friendly'), t('fastReplier'), t('itemAsDescribed'), t('onTime'), t('greatCondition')]
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return
    setIsSubmitting(true)
    try {
      await submitReview({
        revieweeId: partner.id,
        proposalId,
        rating,
        tags: selectedTags,
        body: review.trim(),
      })
      // The action will redirect to /profile
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-5 pb-28 pt-2">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{t('leaveReview')}</h1>
        <div className="w-10" />
      </header>

      <div className="mt-8 flex flex-col items-center text-center">
        <img src={partner.avatar_url || "/placeholder.svg"} alt={partner.name} className="h-20 w-20 rounded-full object-cover shadow-sm" />
        <h2 className="mt-4 text-xl font-bold text-foreground">{t('howWasSwapping')} {partner.name}?</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('feedbackHelps')}</p>
      </div>

      <div className="mt-10 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={`h-10 w-10 ${
                star <= (hoverRating || rating) ? "text-primary" : "text-muted"
              } transition-colors`}
              fill={star <= (hoverRating || rating) ? "var(--primary)" : "currentColor"}
            />
          </button>
        ))}
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('quickTags')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('writeReview')}</p>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder={t('placeholderReview')}
          className="mt-3 w-full resize-none rounded-2xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          rows={4}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
        <button
          disabled={rating === 0 || isSubmitting}
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submitReview')}
        </button>
      </div>
    </main>
  )
}
