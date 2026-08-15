"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function LiveSwapBadge({ 
  initialHasUnseen, 
  userId 
}: { 
  initialHasUnseen: boolean
  userId: string 
}) {
  const [hasUnseen, setHasUnseen] = useState(initialHasUnseen)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchUnreadSwaps = async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      let count = 0

      const [
        { count: propProposer },
        { count: propReceiver },
        { count: purchBuyer },
        { count: purchSeller }
      ] = await Promise.all([
        supabase.from('swap_proposals').select('*', { count: 'exact', head: true }).eq('proposer_id', userId).eq('proposer_read', false).not('hidden_for', 'cs', `{${userId}}`).gte('updated_at', since),
        supabase.from('swap_proposals').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('receiver_read', false).not('hidden_for', 'cs', `{${userId}}`).gte('updated_at', since),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('buyer_id', userId).eq('buyer_read', false).not('hidden_for', 'cs', `{${userId}}`).gte('updated_at', since),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('seller_id', userId).eq('seller_read', false).not('hidden_for', 'cs', `{${userId}}`).gte('updated_at', since)
      ])

      count = (propProposer || 0) + (propReceiver || 0) + (purchBuyer || 0) + (purchSeller || 0)
      setHasUnseen(count > 0)
    }

    const channel = supabase
      .channel(`profile_swaps_${userId}_${Date.now()}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "swap_proposals"
      }, fetchUnreadSwaps)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "purchases"
      }, fetchUnreadSwaps)
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  if (!hasUnseen) return null

  return (
    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
  )
}
