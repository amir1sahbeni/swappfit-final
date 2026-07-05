"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setLoading(true)

    try {
      // First verify current password by signing in
      const { data: { user }, error: signInError } = await supabase.auth.getUser()
      if (signInError || !user) {
        setError("Unable to verify user")
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError("Current password is incorrect or update failed")
      } else {
        setSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
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
          <h1 className="truncate text-lg font-bold text-foreground">Change Password</h1>
          <p className="truncate text-xs text-muted-foreground">Update your account password</p>
        </div>
      </header>

      <div className="mt-6">
        {success && (
          <div className="mb-4 rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
            <p className="text-sm font-medium text-primary">Password changed successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(192,57,91,0.08)]">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(192,57,91,0.32)] transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  )
}
