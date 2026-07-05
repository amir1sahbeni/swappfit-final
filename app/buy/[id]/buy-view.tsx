"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowRight, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react"
import type { Item, Seller } from "@/lib/types"
import { createPurchase } from "@/app/actions/purchases"
import { PageHeader } from "@/components/page-header"
import { ItemCard } from "@/components/item-card"
import { useTranslations } from "next-intl"

export function BuyView({ item, seller, swapConflict = false }: { item: Item; seller: Seller; swapConflict?: boolean }) {
  const t = useTranslations("Buy")
  const tErr = useTranslations("Errors")
  const router = useRouter()
  const [isBuying, setIsBuying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirmBuy() {
    setIsBuying(true)
    setError(null)
    try {
      const res = await createPurchase(item.id)
      if (res.success && res.purchaseId) {
        setSuccess(true)
        setTimeout(() => {
          router.replace(`/purchase/${res.purchaseId}`)
        }, 1400)
      } else {
        setError(res.error ? tErr(res.error) : t("failedToSend"))
        setIsBuying(false)
      }
    } catch (e: any) {
      setError(t("failedToSend"))
      setIsBuying(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh px-5 pb-28 pt-2">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">{t("itemDetails")}</p>
        <ItemCard item={item} />
      </section>

      <section className="mt-6 rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-sm font-medium text-muted-foreground">{t("price")}</span>
          <span className="text-xl font-bold text-primary">{item.price}</span>
        </div>
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm font-medium text-muted-foreground">{t("seller")}</span>
          <div className="flex items-center gap-2">
            <img src={seller.avatar || "/placeholder.svg"} alt={seller.name} className="h-6 w-6 rounded-full object-cover" />
            <span className="text-sm font-semibold text-foreground">{seller.name}</span>
          </div>
        </div>
      </section>

      {/* Cross-flow conflict warning */}
      {swapConflict && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">{t("pendingSwapWarning")}</p>
            <p className="text-xs text-destructive/80 mt-0.5">{t("pendingSwapDesc")}</p>
          </div>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {t("requestSentRedirect")}
        </div>
      )}

      <section className="mt-6">
        <p className="text-sm leading-relaxed text-muted-foreground text-center px-4">
          {t("disclaimer")}
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] border-t border-border bg-card/90 px-5 py-3 pb-[calc(env(safe-area-inset-bottom,8px)+10px)] backdrop-blur-xl">
        {success ? (
          <div className="flex flex-col gap-3">
            <div className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary/10 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {t("requestSent")}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmBuy}
              disabled={isBuying || swapConflict}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
            >
              {isBuying ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {t("title")}
              {!isBuying && <ArrowRight className="h-4 w-4" />}
            </button>
            <Link
              href={`/chats/${seller.id}`}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-muted text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              {t("message", { name: seller.name })}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
