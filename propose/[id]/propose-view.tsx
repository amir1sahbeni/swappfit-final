"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ArrowRightLeft, Send, CheckCircle2, Loader2, Lock } from "lucide-react"
import type { Item, Profile } from "@/lib/types"
import { sendProposal } from "@/app/actions/proposals"
import { useTranslations } from 'next-intl'

export function ProposeView({
  wantedItem,
  receiver,
  myItems,
  lockedItemIds = [],
  hasPurchaseConflict = false,
}: {
  wantedItem: Item
  receiver: Profile
  myItems: Item[]
  lockedItemIds?: string[]
  hasPurchaseConflict?: boolean
}) {
  const t = useTranslations('Propose')
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedItem = myItems.find((i) => i.id === selectedId)

  const handleSubmit = async () => {
    if (!selectedId || isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await sendProposal({
        wantedItemId: wantedItem.id,
        offeredItemId: selectedId,
        receiverId: receiver.id,
        note: note.trim(),
      })
      if (result.success && result.proposalId) {
        setSuccess(true)
        setTimeout(() => {
          router.replace(`/exchange/${result.proposalId}`)
        }, 1400)
      } else {
        setError(result.error || 'Failed to send proposal.')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setIsSubmitting(false)
    }
  }

  // Cross-flow block: user already has a pending purchase for this item
  if (hasPurchaseConflict) {
    return (
      <main className="mx-auto w-full max-w-[390px] min-h-dvh flex flex-col items-center justify-center px-5 gap-4">
        <div className="rounded-2xl bg-muted p-6 text-center">
          <p className="text-sm font-bold text-foreground">You have a pending purchase for this item.</p>
          <p className="mt-1 text-xs text-muted-foreground">Cancel your purchase request before proposing a swap.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex h-12 w-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
        >
          Go Back
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{t('proposeSwap')}</h1>
        <div className="w-10" />
      </header>

      {/* Swap Visual */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="flex w-28 flex-col items-center">
          <img src={wantedItem.image || "/placeholder.svg"} alt={wantedItem.name} className="aspect-square w-full rounded-2xl object-cover shadow-sm" />
          <p className="mt-2 truncate text-xs font-semibold text-foreground text-center w-full">{wantedItem.name}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div className="flex w-28 flex-col items-center">
          {selectedItem ? (
            <img src={selectedItem.image || "/placeholder.svg"} alt={selectedItem.name} className="aspect-square w-full rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted">
              <p className="text-xs text-muted-foreground">{t('select')}</p>
            </div>
          )}
          <p className="mt-2 truncate text-xs font-semibold text-foreground text-center w-full">
            {selectedItem ? selectedItem.name : t('yourItem')}
          </p>
        </div>
      </div>

      {/* Inline error */}
      {error && (
        <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Swap proposal sent! Redirecting…
        </div>
      )}

      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('selectItemOffer')}</p>

        {myItems.length === 0 ? (
          <div className="mt-4 rounded-xl bg-muted p-4 text-center">
            <p className="text-sm font-medium text-foreground">{t('noItemsYet')}</p>
            <button onClick={() => router.push('/create')} className="mt-2 text-xs font-bold text-primary">{t('addItemFirst')}</button>
          </div>
        ) : (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-5 px-5">
            {myItems.map((item) => {
              const isLocked = lockedItemIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => !isLocked && setSelectedId(item.id)}
                  disabled={isLocked}
                  className={`relative shrink-0 w-24 overflow-hidden rounded-xl border-2 transition-all active:scale-95 ${
                    isLocked
                      ? 'border-transparent opacity-40 cursor-not-allowed'
                      : selectedId === item.id
                      ? 'border-primary'
                      : 'border-transparent'
                  }`}
                >
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="aspect-square w-full object-cover" />
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {!isLocked && selectedId === item.id && (
                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {lockedItemIds.length > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            <Lock className="inline h-3 w-3 mr-1" />Greyed items are already in a pending swap.
          </p>
        )}
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t('addMessage')}</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`${t('placeholderMessage')} ${receiver.name}, ${t('placeholderMessage2')} ${wantedItem.name}!`}
          className="mt-3 w-full resize-none rounded-2xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
        <button
          disabled={!selectedId || isSubmitting || success}
          onClick={handleSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {success ? 'Sent!' : t('sendProposal')}
        </button>
      </div>
    </main>
  )
}
