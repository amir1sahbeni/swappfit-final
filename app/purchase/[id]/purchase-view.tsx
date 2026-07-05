"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, XCircle, MapPin, Loader2, MessageCircle, Package, PackageCheck, Star, X } from "lucide-react"
import type { Purchase, Profile } from "@/lib/types"
import { acceptPurchase, rejectPurchase, completePurchase, cancelPurchase } from "@/app/actions/purchases"
import { listingToItem } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'

export function PurchaseView({
  purchase: initialPurchase,
  partner,
  isSeller,
}: {
  purchase: Purchase
  partner: Profile
  isSeller: boolean
}) {
  const t = useTranslations('PurchaseView')
  const tErr = useTranslations('Errors')
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [purchase, setPurchase] = useState<Purchase>(initialPurchase)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [hasRated, setHasRated] = useState(false)

  // Realtime subscription: update purchase state without page refresh
  useEffect(() => {
    const supabase = createClient()

    const checkRating = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: review } = await supabase
        .from('reviews')
        .select('id')
        .eq('proposal_id', purchase.id)
        .eq('reviewer_id', user.id)
        .maybeSingle()
      setHasRated(!!review)
    }
    checkRating()

    const channel = supabase
      .channel(`purchase_${purchase.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchases', filter: `id=eq.${purchase.id}` },
        (payload) => {
          setPurchase(prev => ({ ...prev, ...(payload.new as Partial<Purchase>) }))
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [purchase.id])

  const handleAction = async (action: "accept" | "reject" | "complete") => {
    setIsUpdating(true)
    setActionError(null)
    try {
      let res
      if (action === "accept") res = await acceptPurchase(purchase.id)
      else if (action === "reject") res = await rejectPurchase(purchase.id)
      else res = await completePurchase(purchase.id)

      if (res.success) {
        if (action === 'reject') {
          router.replace('/')
        } else {
          router.replace(`/purchase/${purchase.id}`)
        }
      } else {
        setActionError(res.error ? tErr(res.error) : t("somethingWentWrong"))
        setIsUpdating(false)
      }
    } catch (err: any) {
      setActionError(t("somethingWentWrong"))
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    setActionError(null)
    try {
      const res = await cancelPurchase(purchase.id)
      if (res.success) {
        router.replace('/')
      } else {
        setActionError(res.error ? tErr(res.error) : t("failedToCancel"))
        setIsCancelling(false)
        setCancelConfirm(false)
      }
    } catch (err: any) {
      setActionError(err.message || "Something went wrong")
      setIsCancelling(false)
      setCancelConfirm(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'pending_seller_approval') return 'text-yellow-500 bg-yellow-500/10'
    if (status === 'accepted') return 'text-green-500 bg-green-500/10'
    if (status === 'completed') return 'text-primary bg-primary/10'
    if (status === 'cancelled') return 'text-destructive bg-destructive/10'
    return 'text-muted-foreground bg-muted'
  }

  const getStatusLabel = (status: string) => {
    if (status === 'pending_seller_approval') return t("statusPending")
    if (status === 'accepted') return t("statusAccepted")
    if (status === 'completed') return t("statusCompleted")
    if (status === 'cancelled') return t("statusCancelled")
    return status
  }

  const item = purchase.items?.[0]?.item
  const itemDisplay = item ? listingToItem(item) : null
  const ratingLink = `/rating/${purchase.id}?type=purchase`
  const isTerminal = ['completed', 'cancelled'].includes(purchase.status)
  const buyerCanCancel = !isSeller && !isTerminal

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <header className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90">
          <ChevronLeft className="h-5 w-5 text-foreground rtl-flip" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{t("title")}</h1>
        <div className="w-10" />
      </header>

      <div className="mt-8 flex flex-col items-center">
        <div className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${getStatusColor(purchase.status)}`}>
          {getStatusLabel(purchase.status)}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="flex w-36 flex-col items-center">
          {itemDisplay ? (
            <>
              <img src={itemDisplay.image || "/placeholder.svg"} alt={itemDisplay.name} className="aspect-square w-full rounded-2xl object-cover shadow-sm no-rtl-flip" />
              <p className="mt-2 truncate text-xs font-semibold text-foreground text-center w-full">{itemDisplay.name}</p>
              <p className="text-xs font-bold text-primary">{itemDisplay.price}</p>
              {item?.status && item.status !== 'active' && (
                <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                  {item.status === 'sold' ? 'Sold' : item.status}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="aspect-square w-full rounded-2xl bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-2 truncate text-xs font-semibold text-muted-foreground text-center w-full">{t("itemUnavailable")}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-muted p-5">
        <p className="text-xs font-semibold text-muted-foreground">{isSeller ? t("buyer") : t("seller")}</p>
        <div className="mt-3 flex items-center gap-3">
          <img src={partner.avatar_url || "/placeholder.svg"} alt={partner.name} className="h-10 w-10 rounded-full object-cover no-rtl-flip" />
          <div>
            <p className="text-sm font-bold text-foreground">{partner.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {partner.location || t("locationNotSet")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t("totalPrice")}</p>
            <p className="text-lg font-bold text-primary">${(purchase.total_price / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Rating reminder (non-blocking) */}
      {purchase.status === 'completed' && !hasRated && (
        <Link
          href={ratingLink}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3 transition-transform active:scale-95"
        >
          <Star className="h-4 w-4 shrink-0 text-primary" fill="var(--primary)" />
          <span className="text-sm font-semibold text-primary">{t("rateExperience", { name: partner.name })}</span>
        </Link>
      )}

      {/* Action error */}
      {actionError && (
        <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {actionError}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[390px] rounded-[32px] bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t("cancelConfirmTitle")}</h3>
              <button onClick={() => setCancelConfirm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {purchase.status === 'accepted' && (
              <p className="mb-4 text-sm text-muted-foreground">
                {t("cancelConfirmDesc")}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
              >
                {t("keepIt")}
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("yesCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">

        {/* SELLER — pending approval */}
        {purchase.status === "pending_seller_approval" && isSeller && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <button disabled={isUpdating} onClick={() => handleAction("reject")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-muted text-sm font-semibold text-destructive transition-transform active:scale-95 disabled:opacity-50">
                <XCircle className="h-4 w-4" /> {t("decline")}
              </button>
              <button disabled={isUpdating} onClick={() => handleAction("accept")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50">
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Accept
              </button>
            </div>
            <Link href={`/chats/${partner.id}`}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95">
              <MessageCircle className="h-4 w-4" /> {t("message", { name: partner.name })}
            </Link>
          </div>
        )}

        {/* BUYER — pending (waiting for seller) */}
        {purchase.status === "pending_seller_approval" && !isSeller && (
          <div className="flex flex-col gap-2">
            <div className="flex h-12 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {t("waitingToRespond", { name: partner.name })}
            </div>
            <div className="flex gap-2">
              <Link href={`/chats/${partner.id}`}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95">
                <MessageCircle className="h-4 w-4" /> Message
              </Link>
              <button onClick={() => setCancelConfirm(true)}
                className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95">
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* ACCEPTED — buyer marks received, seller waits */}
        {purchase.status === "accepted" && (
          <div className="flex w-full flex-col gap-2">
            {!isSeller ? (
              <>
                <button disabled={isUpdating} onClick={() => handleAction("complete")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                  {t("markReceived")}
                </button>
                <div className="flex gap-2">
                  <Link href={`/chats/${partner.id}`}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95">
                    <MessageCircle className="h-4 w-4" /> Message
                  </Link>
                  <button onClick={() => setCancelConfirm(true)}
                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-medium text-destructive transition-transform active:scale-95">
                    {t("cancel")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-12 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {t("waitingToConfirm", { name: partner.name })}
                </div>
                <Link href={`/chats/${partner.id}`}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95">
                  <MessageCircle className="h-4 w-4" /> Message {partner.name}
                </Link>
              </>
            )}
          </div>
        )}

        {/* CANCELLED */}
        {purchase.status === "cancelled" && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-destructive/10 px-6 py-2 text-sm font-bold text-destructive">
                {t("purchaseCancelled")}
              </div>
            </div>
            <Link href="/"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95">
              {t("browseItems")}
            </Link>
          </div>
        )}

        {/* COMPLETED */}
        {purchase.status === "completed" && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-brand-gradient px-6 py-2 text-sm font-bold text-primary-foreground shadow-[0_4px_10px_rgba(192,57,91,0.2)]">
                {t("completedMark")}
              </div>
            </div>
            {!hasRated && (
              <Link href={ratingLink}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95">
                <Star className="h-4 w-4" fill="currentColor" /> {t("leaveRating")}
              </Link>
            )}
            <Link href={`/chats/${partner.id}`}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95">
              <MessageCircle className="h-4 w-4" /> Message {partner.name}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
