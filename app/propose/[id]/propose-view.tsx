"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Send, CheckCircle2, Loader2, Lock, ArrowRightLeft, Info } from "lucide-react"
import type { Item, Profile } from "@/lib/types"
import { sendProposal } from "@/app/actions/proposals"
import { useTranslations } from 'next-intl'
import { ItemDetailModal } from "@/components/item-detail-modal"

export function ProposeView({
  wantedItem,
  sellerItems,
  receiver,
  myItems,
  lockedItemIds = [],
  hasPurchaseConflict = false,
}: {
  wantedItem: Item
  sellerItems: Item[]
  receiver: Profile
  myItems: Item[]
  lockedItemIds?: string[]
  hasPurchaseConflict?: boolean
}) {
  const t = useTranslations('Propose')
  const router = useRouter()
  const [selectedWantedIds, setSelectedWantedIds] = useState<string[]>([wantedItem.id])
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewItem, setPreviewItem] = useState<Item | null>(null)

  const selectedWanted = sellerItems.filter(i => selectedWantedIds.includes(i.id))
  const selectedOffered = myItems.filter(i => selectedOfferedIds.includes(i.id))

  const toggleWanted = (id: string) => {
    if (id === wantedItem.id) return // Cannot deselect trigger item
    setSelectedWantedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const toggleOffered = (id: string) => {
    if (lockedItemIds.includes(id)) return
    setSelectedOfferedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = async () => {
    if (!selectedWantedIds.length || !selectedOfferedIds.length || isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await sendProposal({
        wantedItemIds: selectedWantedIds,
        offeredItemIds: selectedOfferedIds,
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
    <>
      {previewItem && (
        <ItemDetailModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
      <main className="mx-auto w-full max-w-[390px] min-h-dvh pb-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur flex items-center justify-between px-5 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{t('proposeSwap')}</h1>
          <div className="w-10" />
        </header>

        {/* Inline error */}
        {error && (
          <div className="px-5 mt-2">
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          </div>
        )}

        {/* Success toast */}
        {success && (
          <div className="px-5 mt-2">
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Swap proposal sent! Redirecting…
            </div>
          </div>
        )}

        {/* Section 1: Their Closet */}
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">{t('theirCloset', { name: receiver.name })}</h2>
            <span className="text-xs font-semibold text-muted-foreground">{t('itemsSelected', { count: selectedWantedIds.length })}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {sellerItems.map((item) => {
              const isSelected = selectedWantedIds.includes(item.id)
              const isTrigger = item.id === wantedItem.id
              return (
                <div
                  key={item.id}
                  className={`flex flex-col overflow-hidden rounded-xl border-2 transition-all ${
                    isSelected ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <button
                    onClick={() => toggleWanted(item.id)}
                    className="relative aspect-square w-full active:scale-95 transition-transform"
                  >
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                    <div className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-sm">
                      {item.price}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20" />
                    )}
                    {isSelected && (
                      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    )}
                    {isTrigger && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 text-center text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                        {t('preSelected')}
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col p-2 pb-2 bg-card">
                    <p className="truncate text-[10px] font-semibold text-foreground">{item.name}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                      className="mt-1 flex items-center justify-center gap-1 rounded bg-muted py-1 text-[9px] font-bold text-muted-foreground transition-transform active:scale-95"
                    >
                      <Info className="h-3 w-3" /> Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Divider */}
        <div className="my-8 mx-5 h-px bg-border" />

        {/* Section 2: Your Closet */}
        <section className="px-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">{t('yourCloset')}</h2>
            <span className="text-xs font-semibold text-muted-foreground">{t('itemsSelected', { count: selectedOfferedIds.length })}</span>
          </div>

          {myItems.length === 0 ? (
            <div className="rounded-xl bg-muted p-6 text-center">
              <p className="text-sm font-medium text-foreground">{t('noItemsYet')}</p>
              <button onClick={() => router.push('/create')} className="mt-2 text-xs font-bold text-primary">{t('addItemFirst')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {myItems.map((item) => {
                const isSelected = selectedOfferedIds.includes(item.id)
                const isLocked = lockedItemIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col overflow-hidden rounded-xl border-2 transition-all ${
                      isLocked
                        ? 'border-transparent opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => toggleOffered(item.id)}
                      disabled={isLocked}
                      className="relative aspect-square w-full active:scale-95 transition-transform"
                    >
                      <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
                      <div className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm shadow-sm">
                        {item.price}
                      </div>
                      {isLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                          <Lock className="h-5 w-5 mb-1" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{t('locked')}</span>
                        </div>
                      )}
                      {!isLocked && isSelected && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                      {!isLocked && isSelected && (
                        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                    <div className="flex flex-col p-2 pb-2 bg-card">
                      <p className="truncate text-[10px] font-semibold text-foreground">{item.name}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                        className="mt-1 flex items-center justify-center gap-1 rounded bg-muted py-1 text-[9px] font-bold text-muted-foreground transition-transform active:scale-95"
                      >
                        <Info className="h-3 w-3" /> Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Swap Summary Fixed Bottom */}
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/95 px-5 py-4 pb-[calc(env(safe-area-inset-bottom,8px)+16px)] backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          
          {/* Note input */}
          <div className="mb-4">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('addMessage')}
              className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            {/* You want stacked cards */}
            <div className="flex flex-col gap-1 w-24">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('youWant')}</span>
              <button 
                onClick={() => selectedWanted.length > 0 && setPreviewItem(selectedWanted[0])}
                className="relative h-12 w-full text-left transition-transform active:scale-95"
              >
                {selectedWanted.slice(0, 3).map((item, index) => (
                  <img 
                    key={item.id} 
                    src={item.image || "/placeholder.svg"} 
                    className="absolute aspect-square w-12 rounded-lg object-cover border border-background shadow-sm" 
                    style={{ left: index * 10, zIndex: 10 - index }} 
                  />
                ))}
                {selectedWanted.length > 1 && (
                  <div className="absolute -right-1 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                    {selectedWanted.length}
                  </div>
                )}
              </button>
            </div>

            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />

            {/* You offer stacked cards */}
            <div className="flex flex-col gap-1 w-24 items-end text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('youOffer')}</span>
              <button 
                onClick={() => selectedOffered.length > 0 && setPreviewItem(selectedOffered[0])}
                className="relative h-12 w-full text-right transition-transform active:scale-95"
              >
                {selectedOffered.slice(0, 3).map((item, index) => (
                  <img 
                    key={item.id} 
                    src={item.image || "/placeholder.svg"} 
                    className="absolute aspect-square w-12 rounded-lg object-cover border border-background shadow-sm" 
                    style={{ right: index * 10, zIndex: 10 - index }} 
                  />
                ))}
                {selectedOffered.length > 1 && (
                  <div className="absolute -left-1 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                    {selectedOffered.length}
                  </div>
                )}
              </button>
            </div>
          </div>

          <button
            disabled={!selectedWantedIds.length || !selectedOfferedIds.length || isSubmitting || success}
            onClick={handleSubmit}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(192,57,91,0.25)] transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {success ? 'Sent!' : t('sendProposal')}
          </button>
        </div>
      </main>
    </>
  )
}
