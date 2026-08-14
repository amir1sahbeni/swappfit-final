"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { removeSwapProposal, removePurchaseFromHistory, hideAllSwapsFromHistory, markSwapAsRead, markAllSwapsAsRead } from '@/app/actions/swaps'
import { useTranslations } from 'next-intl'
import { Trash2, Trash, CheckCheck } from 'lucide-react'

export function SwapsList({ history, userId }: { history: any[], userId: string }) {
  const t = useTranslations('Swaps')
  const router = useRouter()
  const [localHistory, setLocalHistory] = useState(history)
  const [isClearing, setIsClearing] = useState(false)

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
      router.refresh() // Force UI update
    } catch (error: any) {
      alert(t('failedToDelete') + error.message)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm(t('clearAllConfirm', { fallback: 'Clear all swap history? This cannot be undone.' }))) return

    try {
      setIsClearing(true)
      
      // Optimistic update: remove completed, cancelled, declined
      setLocalHistory(localHistory.filter(item => {
        const isActive = item.type === 'swap'
          ? ['pending', 'accepted'].includes(item.status)
          : ['pending_seller_approval', 'accepted'].includes(item.status)
        return isActive
      }))
      
      await hideAllSwapsFromHistory()
      router.refresh()
    } catch (error: any) {
      alert(t('failedToClear') + error.message)
    } finally {
      setIsClearing(false)
    }
  }

  const handleMarkRead = async (id: string, type: 'swap' | 'purchase') => {
    // Optimistic update
    setLocalHistory(prev => prev.map(item => {
      if (item.id === id) {
        if (item.type === 'swap') {
          return {
            ...item,
            ...(item.proposer_id === userId ? { proposer_read: true } : { receiver_read: true })
          }
        } else {
          return {
            ...item,
            ...(item.buyer_id === userId ? { buyer_read: true } : { seller_read: true })
          }
        }
      }
      return item
    }))
    
    try {
      await markSwapAsRead(id, type)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAllRead = async () => {
    setLocalHistory(prev => prev.map(item => {
      if (item.type === 'swap') {
        return {
          ...item,
          ...(item.proposer_id === userId ? { proposer_read: true } : { receiver_read: true })
        }
      } else {
        return {
          ...item,
          ...(item.buyer_id === userId ? { buyer_read: true } : { seller_read: true })
        }
      }
    }))
    try {
      await markAllSwapsAsRead()
      router.refresh()
    } catch (error: any) {
      alert(t('failedToMarkRead', { fallback: 'Failed to mark as read' }) + error.message)
    }
  }

  if (localHistory.length === 0) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">{t('noSwaps')}</p>
  }

  const hasHideableHistory = localHistory.some(item => {
    return item.type === 'swap' 
      ? !['pending', 'accepted'].includes(item.status)
      : !['pending_seller_approval', 'accepted'].includes(item.status)
  })

  const hasUnreadSwaps = localHistory.some(item => {
    if (item.type === 'swap') {
      return item.proposer_id === userId ? !item.proposer_read : !item.receiver_read
    } else {
      return item.buyer_id === userId ? !item.buyer_read : !item.seller_read
    }
  })

  return (
    <div className="mt-4 flex flex-col gap-3">
      {(hasHideableHistory || hasUnreadSwaps) && (
        <div className="flex justify-between mb-2">
          {hasUnreadSwaps ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors active:scale-95"
            >
              <CheckCheck className="h-4 w-4" />
              {t('markAllRead', { fallback: 'Mark all as read' })}
            </button>
          ) : <div />}
          {hasHideableHistory && (
            <button
              onClick={handleClearHistory}
              disabled={isClearing}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <Trash className="h-3.5 w-3.5" />
              {t('clearHistory', { fallback: 'Clear History' })}
            </button>
          )}
        </div>
      )}
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

          const isUnread = proposal.proposer_id === userId ? !proposal.proposer_read : !proposal.receiver_read

          return (
            <div key={proposal.id} className="flex items-center gap-2">
              <Link
                href={`/exchange/${proposal.id}`}
                onClick={(e) => {
                  if (isUnread) handleMarkRead(proposal.id, 'swap')
                }}
                className={`relative flex-1 flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98] border ${
                  isUnread
                    ? "bg-brand-gradient/10 border-brand/30 shadow-[0_4px_15px_rgba(192,57,91,0.15)]"
                    : "bg-card border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                }`}
              >
                {isUnread && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background z-10 animate-in zoom-in" />
                )}
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

          const isUnread = purchase.buyer_id === userId ? !purchase.buyer_read : !purchase.seller_read

          return (
            <div key={purchase.id} className="flex items-center gap-2">
              <Link
                href={`/purchase/${purchase.id}`}
                onClick={(e) => {
                  if (isUnread) handleMarkRead(purchase.id, 'purchase')
                }}
                className={`relative flex-1 flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98] border ${
                  isUnread
                    ? "bg-brand-gradient/10 border-brand/30 shadow-[0_4px_15px_rgba(192,57,91,0.15)]"
                    : "bg-card border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                }`}
              >
                {isUnread && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background z-10 animate-in zoom-in" />
                )}
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
