"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { removeSwapProposal, removePurchaseFromHistory, hideAllSwapsFromHistory } from '@/app/actions/swaps'
import { useTranslations } from 'next-intl'
import { Trash2, Trash, CheckCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SwapsList({ userId }: { userId: string }) {
  const t = useTranslations('Swaps')
  const router = useRouter()
  const supabase = createClient()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  const loadHistory = useCallback(async () => {
    // Fetch proposals
    const { data: proposals } = await supabase
      .from('swap_proposals')
      .select('id, proposer_id, receiver_id, offered_item_id, wanted_item_id, status, note, completed_at, cancelled_at, created_at, updated_at, proposer_confirmed, receiver_confirmed, proposer_read, receiver_read')
      .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
      .not('hidden_for', 'cs', `{${userId}}`)
      .order('created_at', { ascending: false })
      .limit(100)

    // Fetch purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, buyer_id, seller_id, status, total_price, created_at, updated_at, buyer_read, seller_read')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .not('hidden_for', 'cs', `{${userId}}`)
      .order('created_at', { ascending: false })

    // Gather all user IDs for profiles
    const userIds = new Set<string>()
    ;(proposals || []).forEach(p => { userIds.add(p.proposer_id); userIds.add(p.receiver_id) })
    ;(purchases || []).forEach(p => { userIds.add(p.buyer_id); userIds.add(p.seller_id) })

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, handle, avatar_url')
      .in('id', Array.from(userIds))
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    // Gather listing IDs for proposals
    const proposalIds = (proposals || []).map(p => p.id)
    const { data: proposalItems } = proposalIds.length > 0
      ? await supabase.from('swap_proposal_items').select('proposal_id, listing_id, side').in('proposal_id', proposalIds)
      : { data: [] }

    const listingIds = new Set<string>()
    ;(proposals || []).forEach(p => {
      if (p.offered_item_id) listingIds.add(p.offered_item_id)
      if (p.wanted_item_id) listingIds.add(p.wanted_item_id)
    })
    ;(proposalItems || []).forEach((pi: any) => listingIds.add(pi.listing_id))

    // Gather listing IDs for purchases
    const purchaseIds = (purchases || []).map(p => p.id)
    const { data: purchaseItems } = purchaseIds.length > 0
      ? await supabase.from('purchase_items').select('purchase_id, item_id').in('purchase_id', purchaseIds)
      : { data: [] }
    ;(purchaseItems || []).forEach((pi: any) => listingIds.add(pi.item_id))

    const { data: listings } = listingIds.size > 0
      ? await supabase.from('listings').select('id, name, images').in('id', Array.from(listingIds))
      : { data: [] }
    const listingMap = new Map((listings || []).map(l => [l.id, l]))

    // Assemble proposals
    const assembledProposals = (proposals || []).map(p => {
      const myItems = (proposalItems || []).filter((pi: any) => pi.proposal_id === p.id)
      return {
        ...p,
        type: 'swap' as const,
        proposer: profileMap.get(p.proposer_id) || null,
        receiver: profileMap.get(p.receiver_id) || null,
        offered_item: p.offered_item_id ? listingMap.get(p.offered_item_id) || null : null,
        wanted_item: p.wanted_item_id ? listingMap.get(p.wanted_item_id) || null : null,
        swap_proposal_items: myItems.map((pi: any) => ({ ...pi, listing: listingMap.get(pi.listing_id) }))
      }
    })

    // Assemble purchases
    const purchaseItemsByPurchase = new Map<string, any[]>()
    ;(purchaseItems || []).forEach((pi: any) => {
      if (!purchaseItemsByPurchase.has(pi.purchase_id)) purchaseItemsByPurchase.set(pi.purchase_id, [])
      purchaseItemsByPurchase.get(pi.purchase_id)!.push({ ...pi, item: listingMap.get(pi.item_id) })
    })
    const assembledPurchases = (purchases || []).map(p => ({
      ...p,
      type: 'purchase' as const,
      buyer: profileMap.get(p.buyer_id) || null,
      seller: profileMap.get(p.seller_id) || null,
      items: purchaseItemsByPurchase.get(p.id) || []
    }))

    const combined = [...assembledProposals, ...assembledPurchases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setHistory(combined)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadHistory()

    // Realtime subscription so status updates appear live
    const channel = supabase
      .channel(`swaps_list_${userId}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_proposals' }, loadHistory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, loadHistory)
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [loadHistory])

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
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (error: any) {
      alert(t('failedToDelete') + error.message)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm(t('clearAllConfirm', { fallback: 'Clear all swap history? This cannot be undone.' }))) return

    try {
      setIsClearing(true)
      setHistory(prev => prev.filter(item => {
        const isActive = item.type === 'swap'
          ? ['pending', 'accepted'].includes(item.status)
          : ['pending_seller_approval', 'accepted'].includes(item.status)
        return isActive
      }))
      await hideAllSwapsFromHistory()
    } catch (error: any) {
      alert(t('failedToClear') + error.message)
    } finally {
      setIsClearing(false)
    }
  }

  const handleMarkRead = async (id: string, type: 'swap' | 'purchase') => {
    // Update local state immediately
    setHistory(prev => prev.map(item => {
      if (item.id !== id) return item
      if (item.type === 'swap') {
        return { ...item, ...(item.proposer_id === userId ? { proposer_read: true } : { receiver_read: true }) }
      } else {
        return { ...item, ...(item.buyer_id === userId ? { buyer_read: true } : { seller_read: true }) }
      }
    }))
    // Write directly to DB via browser client (same path bottom-nav reads from)
    if (type === 'swap') {
      const item = history.find(i => i.id === id)
      const field = item?.proposer_id === userId ? 'proposer_read' : 'receiver_read'
      await supabase.from('swap_proposals').update({ [field]: true }).eq('id', id)
    } else {
      const item = history.find(i => i.id === id)
      const field = item?.buyer_id === userId ? 'buyer_read' : 'seller_read'
      await supabase.from('purchases').update({ [field]: true }).eq('id', id)
    }
  }

  const handleMarkAllRead = async () => {
    setHistory(prev => prev.map(item => {
      if (item.type === 'swap') {
        return { ...item, ...(item.proposer_id === userId ? { proposer_read: true } : { receiver_read: true }) }
      } else {
        return { ...item, ...(item.buyer_id === userId ? { buyer_read: true } : { seller_read: true }) }
      }
    }))
    // Write directly to DB via browser client
    await supabase.from('swap_proposals').update({ proposer_read: true }).eq('proposer_id', userId).eq('proposer_read', false)
    await supabase.from('swap_proposals').update({ receiver_read: true }).eq('receiver_id', userId).eq('receiver_read', false)
    await supabase.from('purchases').update({ buyer_read: true }).eq('buyer_id', userId).eq('buyer_read', false)
    await supabase.from('purchases').update({ seller_read: true }).eq('seller_id', userId).eq('seller_read', false)
  }

  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (history.length === 0) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">{t('noSwaps')}</p>
  }

  const hasHideableHistory = history.some(item => {
    return item.type === 'swap'
      ? !['pending', 'accepted'].includes(item.status)
      : !['pending_seller_approval', 'accepted'].includes(item.status)
  })

  const hasUnreadSwaps = history.some(item => {
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
      {history.map((item) => {
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
                onClick={() => { if (isUnread) handleMarkRead(proposal.id, 'swap') }}
                className={`relative flex-1 flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98] border ${
                  isUnread
                    ? "bg-brand-gradient/10 border-brand/30 shadow-[0_4px_15px_rgba(192,57,91,0.15)]"
                    : "bg-card border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                }`}
              >
                {isUnread && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background z-10 animate-in zoom-in" />
                )}
                <div 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (partner?.id) router.push(`/user/${partner.id}`) }}
                  className="shrink-0"
                >
                  <Image
                    src={partner?.avatar_url || '/placeholder.svg'}
                    alt={partner?.name || t('user')}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border border-border"
                  />
                </div>
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
                onClick={() => { if (isUnread) handleMarkRead(purchase.id, 'purchase') }}
                className={`relative flex-1 flex items-center gap-4 rounded-3xl p-4 transition-transform active:scale-[0.98] border ${
                  isUnread
                    ? "bg-brand-gradient/10 border-brand/30 shadow-[0_4px_15px_rgba(192,57,91,0.15)]"
                    : "bg-card border-border shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                }`}
              >
                {isUnread && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 h-3.5 w-3.5 rounded-full bg-brand border-2 border-background z-10 animate-in zoom-in" />
                )}
                <div 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (partner?.id) router.push(`/user/${partner.id}`) }}
                  className="shrink-0"
                >
                  <Image
                    src={partner?.avatar_url || '/placeholder.svg'}
                    alt={partner?.name || t('user')}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border border-border"
                  />
                </div>
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
