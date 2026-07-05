"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Download, Loader2 } from "lucide-react"

export default function DownloadDataPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleDownload = async () => {
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Unable to verify user")
        setLoading(false)
        return
      }

      // Fetch all user data
      const [profile, listings, messages, conversations, proposals, reviews, follows, notifications] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('listings').select('*').eq('seller_id', user.id),
        supabase.from('messages').select('*').eq('sender_id', user.id),
        supabase.from('conversations').select('*').or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`),
        supabase.from('swap_proposals').select('*').or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('reviews').select('*').eq('reviewer_id', user.id),
        supabase.from('follows').select('*').eq('follower_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ])

      const userData = {
        profile: profile.data,
        listings: listings.data,
        messages: messages.data,
        conversations: conversations.data,
        swap_proposals: proposals.data,
        reviews: reviews.data,
        follows: follows.data,
        notifications: notifications.data,
        export_date: new Date().toISOString(),
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `swappfit-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      setError("Failed to export data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <header className="sticky top-0 z-40 -mx-5 mb-4 flex items-center gap-3 border-b border-border bg-card/85 px-5 py-3.5 backdrop-blur-xl">
        <button
          aria-label="Go back"
          onClick={() => router.replace('/settings/privacy')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground">Download My Data</h1>
          <p className="truncate text-xs text-muted-foreground">Export your account data</p>
        </div>
      </header>

      <div className="mt-6">
        {error && (
          <div className="mb-4 rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <div className="rounded-2xl bg-card p-6 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
          <p className="text-sm leading-relaxed text-foreground mb-4">
            This will generate and download a JSON file containing your profile data, listings, messages, conversations, swap proposals, reviews, follows, and notifications.
          </p>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Data
              </>
            )}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">What's included</p>
          <ul className="text-sm text-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Profile information
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              All your listings
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Message history
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Swap proposals
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Reviews and ratings
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Follows and notifications
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
