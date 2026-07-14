"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { removeSwapProposal, removePurchaseFromHistory } from '@/app/actions/swaps'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'

export function SwapsList({ history, userId }: { history: any[], userId: string }) {
  const t = useTranslations('Swaps')
  const router = useRouter()
  const [localHistory, setLocalHistory] = useState(history)

  const handleDeleteSwap = async (id: string, type: 'swap' | 'purchase', status: string) => {
    const isActive = type === 'swap'
      ? ['pending', 'accepted'].includes(status)
      : ['pending_seller_approval', 'accepted'].includes(status)

    const confirmMsg = isActive
      ? t('cancelTransactionConfirm')
      : t('removeHistoryConfirm')

    if (!confirm(confirmMsg)) return

    try {
      if (type === 'swap') {
        await removeSwapProposal(id)
      } else {
        await removePurchaseFromHistory(id)
      }
      // Remove from local state
      setLocalHistory(localHistory.filter(item => item.id !== id))
    } catch (error: any) {
      alert(t('failedToDelete') + error.message)
    }
  }

  if (localHistory.length === 0) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">{t('noSwaps')}</p>
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {localHistory.map((item) => {
        if (item.type === 'swap') {
          const proposal = item
          const isReceiver = proposal.receiver_id === userId
          const partner = isReceiver ? proposal.proposer : proposal.receiver
          const itemData = isReceiver ? proposal.wanted_item : proposal.offered_item

          let statusColor = "bg-muted text-muted-foreground"
          if (proposal.status === 'accepted') statusColor = "bg-green-500/10 text-green-600"
          if (proposal.status === 'declined' || proposal.status === 'cancelled') statusColor = "bg-destructive/10 text-destructive"
          if (proposal.status === 'completed') statusColor = "bg-brand-gradient text-primary-foreground shadow-[0_4px_10px_rgba(192,57,91,0.2)]"

          return (
            <div key={proposal.id} className="flex items-center gap-2">
              <Link
                href={`/exchange/${proposal.id}`}
                className="flex-1 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-[0.98] border border-border"
              >
                <Image
                  src={partner?.avatar_url || '/placeholder.svg'}
                  alt={partner?.name || t('user')}
                  width={48}
                  height={48}
                  className="rounded-full object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{partner?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{itemData?.name}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                  {proposal.status}
                </div>
              </Link>
              <button
                onClick={() => handleDeleteSwap(proposal.id, 'swap', proposal.status)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-90"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        } else {
          const purchase = item
          const isSeller = purchase.seller_id === userId
          const partner = isSeller ? purchase.buyer : purchase.seller
          const itemData = purchase.items?.[0]?.item

          let statusColor = "bg-muted text-muted-foreground"
          if (purchase.status === 'accepted') statusColor = "bg-green-500/10 text-green-600"
          if (purchase.status === 'cancelled') statusColor = "bg-destructive/10 text-destructive"
          if (purchase.status === 'completed') statusColor = "bg-brand-gradient text-primary-foreground shadow-[0_4px_10px_rgba(192,57,91,0.2)]"
          if (purchase.status === 'pending_seller_approval') statusColor = "bg-yellow-500/10 text-yellow-600"

          const statusLabel = purchase.status === 'pending_seller_approval' 
            ? t('statusPendingApproval') 
            : purchase.status === 'accepted' 
            ? t('statusAccepted') 
            : purchase.status

          return (
            <div key={purchase.id} className="flex items-center gap-2">
              <Link
                href={`/purchase/${purchase.id}`}
                className="flex-1 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-transform active:scale-[0.98] border border-border"
              >
                <Image
                  src={partner?.avatar_url || '/placeholder.svg'}
                  alt={partner?.name || t('user')}
                  width={48}
                  height={48}
                  className="rounded-full object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{partner?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{itemData?.name} • {t('statusSold')}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                  {statusLabel}
                </div>
              </Link>
              <button
                onClick={() => handleDeleteSwap(purchase.id, 'purchase', purchase.status)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-90"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        }
      })}
    </div>
  )
}
