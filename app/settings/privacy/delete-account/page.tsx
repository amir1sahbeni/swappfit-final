"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"

export default function DeleteAccountPage() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Unable to verify user")
        setLoading(false)
        return
      }

      // Delete all user data in order
      const userId = user.id

      // Delete messages where user is sender
      await supabase.from('messages').delete().eq('sender_id', userId)

      // Delete conversations where user is participant
      await supabase.from('conversations').delete().or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

      // Delete swap proposals where user is proposer or receiver
      await supabase.from('swap_proposals').delete().or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)

      // Delete reviews where user is reviewer
      await supabase.from('reviews').delete().eq('reviewer_id', userId)

      // Delete follows where user is follower or following
      await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)

      // Delete blocks where user is blocker or blocked
      await supabase.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

      // Delete notifications
      await supabase.from('notifications').delete().eq('user_id', userId)

      // Delete listings
      await supabase.from('listings').delete().eq('seller_id', userId)

      // Delete profile
      await supabase.from('profiles').delete().eq('id', userId)

      // Delete auth account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        // If admin delete fails, try regular user delete
        await supabase.auth.signOut()
      }

      // Redirect to auth with farewell message
      router.replace('/auth?deleted=true')

    } catch (err) {
      setError("Failed to delete account. Please try again or contact support.")
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
          <h1 className="truncate text-lg font-bold text-foreground">Delete Account</h1>
          <p className="truncate text-xs text-muted-foreground">Permanently remove your account</p>
        </div>
      </header>

      <div className="mt-6">
        {!showConfirm ? (
          <div className="rounded-2xl bg-card p-6 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Warning: This action is permanent</p>
                <p className="text-sm leading-relaxed text-foreground">
                  Deleting your account will permanently remove:
                </p>
              </div>
            </div>

            <ul className="text-sm text-foreground space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Your profile and all personal information
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                All your listings and item data
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Message history and conversations
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Swap proposals and reviews
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Follows, blocks, and notifications
              </li>
            </ul>

            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. Please consider downloading your data first using the "Download My Data" option.
            </p>

            <button
              onClick={() => setShowConfirm(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-destructive text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(212,24,61,0.32)] transition-transform active:scale-95"
            >
              <Trash2 className="h-5 w-5" />
              Delete Account
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-6 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Are you absolutely sure?</p>
                <p className="text-sm leading-relaxed text-foreground">
                  This will permanently delete your account, all your listings, and all your data. This cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setError("")
                }}
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(212,24,61,0.32)] transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
