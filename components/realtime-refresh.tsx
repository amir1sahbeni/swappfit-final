"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function RealtimeRefresh({ 
  table, 
  filter 
}: { 
  table: string
  filter?: string 
}) {
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    const opts: any = { event: '*', schema: 'public', table }
    if (filter) {
      opts.filter = filter
    }

    const channel = supabase.channel(`realtime_${table}_${Math.random()}`)
      .on('postgres_changes', opts, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, router, supabase])

  return null
}
