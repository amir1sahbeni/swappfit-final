"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ArrowRightLeft, CheckCircle2, XCircle, MapPin, Loader2, MessageCircle, X, Star } from "lucide-react"
import type { Item, Profile, SwapProposal } from "@/lib/types"
import { updateProposalStatus, cancelProposal } from "@/app/actions/proposals"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'
import { ItemDetailModal } from "@/components/item-detail-modal"
import { ItemListModal } from "@/components/item-list-modal"
import { TopProgressBar } from "@/components/top-progress-bar"
import { UserAvatar } from "@/components/user-avatar"

export function ExchangeView({
  proposal: initialProposal,
  partner,
  isReceiver,
  wantedItems,
  offeredItems,
  currentUserId,
}: {
  proposal: SwapProposal
  partner: Profile
  isReceiver: boolean
  wantedItems: Item[]
  offeredItems: Item[]
  currentUserId: string
}) {
  const t = useTranslations('Exchange')
  const tv = useTranslations('ExchangeView')
  const tErr = useTranslations('Errors')
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [hasRated, setHasRated] = useState(false)
  const [proposal, setProposal] = useState<SwapProposal>(initialProposal)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [previewItem, setPreviewItem] = useState<Item | null>(null)
  const [listModalItems, setListModalItems] = useState<{ items: Item[], title: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkRating = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: review } = await supabase
        .from('reviews')
        .select('id')
        .eq('proposal_id', proposal.id)
        .eq('reviewer_id', user.id)
        .maybeSingle()
      setHasRated(!!review)
    }
    checkRating()
  }, [proposal.id])

  useEffect(() => {
    const channel = supabase
      .channel(`proposal_${proposal.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'swap_proposals', filter: `id=eq.${proposal.id}` },
        (payload) => {
          setProposal(prev => ({ ...prev, ...(payload.new as Partial<SwapProposal>) }))
        }
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [proposal.id])

  const handleAction = async (newStatus: "accepted" | "declined" | "completed") => {
    const previousStatus = proposal.status
    const previousProposerConfirmed = proposal.proposer_confirmed
    const previousReceiverConfirmed = proposal.receiver_confirmed

    // 1. Optimistic Update
    setProposal(prev => {
      const updated = { ...prev }
      if (newStatus === 'completed') {
        if (isProposer) updated.proposer_confirmed = true
        else updated.receiver_confirmed = true
        if (updated.proposer_confirmed && updated.receiver_confirmed) {
          updated.status = 'completed'
        }
      } else {
        updated.status = newStatus
      }
      return updated
    })
    setIsUpdating(true)
    setActionError(null)

    try {
      await updateProposalStatus(proposal.id, newStatus)
      if (newStatus === 'declined') {
        router.replace('/')
      } else {
        router.refresh() // Sync with server
      }
    } catch (err: any) {
      // Revert on error
      setProposal(prev => ({ 
        ...prev, 
        status: previousStatus,
        proposer_confirmed: previousProposerConfirmed,
        receiver_confirmed: previousReceiverConfirmed
      }))
      setActionError(tv("somethingWentWrong"))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    const previousStatus = proposal.status
    
    // 1. Optimistic Update
    setProposal(prev => ({ ...prev, status: 'cancelled' }))
    setIsCancelling(true)
    setActionError(null)
    setCancelConfirm(false) // Close modal immediately

    try {
      const res = await cancelProposal(proposal.id)
      if (res.success) {
        router.replace('/')
      } else {
        // Revert on error
        setProposal(prev => ({ ...prev, status: previousStatus }))
        setActionError(res.error ? tErr(res.error) : tv("failedToCancel"))
      }
    } catch (err: any) {
      // Revert on error
      setProposal(prev => ({ ...prev, status: previousStatus }))
      setActionError(err.message || "Something went wrong")
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'text-green-500 bg-green-500/10'
    if (status === 'declined') return 'text-destructive bg-destructive/10'
    if (status === 'cancelled') return 'text-destructive bg-destructive/10'
    if (status === 'completed') return 'text-primary bg-primary/10'
    return 'text-yellow-500 bg-yellow-500/10'
  }

  const getStatusLabel = (status: string) => {
    if (status === 'pending') return tv("statusPending")
    if (status === 'accepted') return tv("statusAccepted")
    if (status === 'declined') return tv("statusDeclined")
    if (status === 'cancelled') return tv("statusCancelled")
    if (status === 'completed') return tv('completed')
    return status
  }

  const isProposer = !isReceiver
  const currentUserConfirmed = isProposer ? proposal.proposer_confirmed : proposal.receiver_confirmed
  const isTerminal = ['declined', 'cancelled', 'completed'].includes(proposal.status)
  const canCancel = isProposer && !isTerminal

  const myItems = isReceiver ? wantedItems : offeredItems
  const theirItems = isReceiver ? offeredItems : wantedItems

  return (
    <>
      <TopProgressBar isUpdating={isUpdating || isCancelling} />
      {previewItem && (
        <ItemDetailModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
      {listModalItems && (
        <ItemListModal 
          items={listModalItems.items} 
          title={listModalItems.title} 
          onClose={() => setListModalItems(null)} 
          onSelect={(item) => setPreviewItem(item)} 
        />
      )}
      <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
        <header className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <ChevronLeft className="h-5 w-5 text-foreground rtl-flip" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{tv('swapStatus')}</h1>
        <div className="w-10" />
      </header>

      <div className="mt-8 flex flex-col items-center">
        <div className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${getStatusColor(proposal.status)}`}>
          {getStatusLabel(proposal.status)}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="flex w-28 flex-col items-center">
          <button 
            onClick={() => myItems.length > 1 ? setListModalItems({ items: myItems, title: isReceiver ? t('yourItem') : t('youOffered') }) : setPreviewItem(myItems[0])}
            className="relative h-28 w-28 transition-transform active:scale-95"
          >
            {myItems.slice(0, 3).map((item, index) => (
              <img 
                key={item.id}
                src={item.image || "/placeholder.svg"} 
                alt="Item" 
                className="absolute aspect-square w-full rounded-2xl object-cover shadow-sm no-rtl-flip border-2 border-background" 
                style={{ top: index * 6, left: index * 6, zIndex: 10 - index }}
              />
            ))}
            {myItems.length > 1 && (
              <div className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                {myItems.length}
              </div>
            )}
          </button>
          <p className="mt-5 truncate text-xs font-semibold text-foreground text-center w-full">
            {isReceiver ? t('yourItem') : t('youOffered')}
          </p>
        </div>
        
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted mt-[-20px]">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex w-28 flex-col items-center">
          <button 
            onClick={() => theirItems.length > 1 ? setListModalItems({ items: theirItems, title: isReceiver ? t('theyOffer') : t('theyGive') }) : setPreviewItem(theirItems[0])}
            className="relative h-28 w-28 transition-transform active:scale-95"
          >
            {theirItems.slice(0, 3).map((item, index) => (
              <img 
                key={item.id}
                src={item.image || "/placeholder.svg"} 
                alt="Item" 
                className="absolute aspect-square w-full rounded-2xl object-cover shadow-sm no-rtl-flip border-2 border-background" 
                style={{ top: index * 6, right: index * 6, zIndex: 10 - index }}
              />
            ))}
            {theirItems.length > 1 && (
              <div className="absolute -left-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                {theirItems.length}
              </div>
            )}
          </button>
          <p className="mt-5 truncate text-xs font-semibold text-foreground text-center w-full">
            {isReceiver ? t('theyOffer') : t('theyGive')}
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-muted p-5">
        <p className="text-xs font-semibold text-muted-foreground">{tv('swapPartner')}</p>
        <div className="mt-3 flex items-center gap-3">
          <UserAvatar id={partner.id} name={partner.name} avatarUrl={partner.avatar_url} className="h-10 w-10" />
          <div>
            <p className="text-sm font-bold text-foreground">{partner.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {partner.location || tv('locationNotSet')}
            </p>
          </div>
        </div>

        {proposal.note && (
          <div className="mt-4 rounded-xl bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tv('noteAttached')}</p>
            <p className="mt-1 text-sm text-foreground italic">"{proposal.note}"</p>
          </div>
        )}
      </div>

      {proposal.status === 'completed' && !hasRated && (
        <Link
          href={`/rating/${proposal.id}`}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3 transition-transform active:scale-95"
        >
          <Star className="h-4 w-4 shrink-0 text-primary" fill="var(--primary)" />
          <span className="text-sm font-semibold text-primary">Rate your swap with {partner.name}</span>
        </Link>
      )}

      {actionError && (
        <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {actionError}
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[390px] rounded-[32px] bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{tv("cancelConfirmTitle")}</h3>
              <button onClick={() => setCancelConfirm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {proposal.status === 'accepted' && (
              <p className="mb-4 text-sm text-muted-foreground">
                {tv("cancelConfirmDesc")}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
              >
                {tv("keepSwap")}
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : tv("yesCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">

        {proposal.status === "pending" && isReceiver && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <button
                disabled={isUpdating}
                onClick={() => handleAction("declined")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-muted text-sm font-semibold text-destructive transition-transform active:scale-95 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> {tv('decline')}
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleAction("accepted")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {tv('acceptSwap')}
              </button>
            </div>
            <Link
              href={`/chats/${partner.id}`}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              {tv('message', { name: partner.name })}
            </Link>
          </div>
        )}

        {proposal.status === "pending" && !isReceiver && (
          <div className="flex flex-col gap-2">
            <div className="flex h-12 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {tv('waitingToRespond', { name: partner.name })}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/chats/${partner.id}`}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Link>
              <button
                onClick={() => setCancelConfirm(true)}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95"
              >
                {tv("cancelSwap")}
              </button>
            </div>
          </div>
        )}

        {proposal.status === "accepted" && (
          <div className="flex w-full flex-col gap-2">
            <Link
              href={`/chats/${partner.id}`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95"
            >
              {tv('message', { name: partner.name })}
            </Link>
            {currentUserConfirmed ? (
              <button
                disabled
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-muted-foreground disabled:opacity-50"
              >
                {tv('waitingToConfirm', { name: partner.name })}
              </button>
            ) : (
              <button
                disabled={isUpdating}
                onClick={() => handleAction("completed")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {tv('markCompleted')}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setCancelConfirm(true)}
                className="flex h-10 w-full items-center justify-center rounded-full bg-destructive/10 text-sm font-medium text-destructive transition-transform active:scale-95"
              >
                Cancel Swap
              </button>
            )}
          </div>
        )}

        {proposal.status === "completed" && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-brand-gradient px-6 py-2 text-sm font-bold text-primary-foreground shadow-[0_4px_10px_rgba(192,57,91,0.2)]">
                {tv('completed')}
              </div>
            </div>
            {!hasRated && (
              <Link
                href={`/rating/${proposal.id}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95"
              >
                <Star className="h-4 w-4" fill="currentColor" />
                {tv('leaveReview')}
              </Link>
            )}
            <Link
              href={`/chats/${partner.id}`}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              {tv('message', { name: partner.name })}
            </Link>
          </div>
        )}

        {(proposal.status === "declined" || proposal.status === "cancelled") && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex h-12 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive">
              {proposal.status === 'cancelled' ? tv("swapCancelled") : tv("swapDeclined")}
            </div>
            <Link
              href="/"
              className="flex h-10 w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              {tv("browseItems")}
            </Link>
          </div>
        )}
      </div>
    </main>
    </>
  )
}
