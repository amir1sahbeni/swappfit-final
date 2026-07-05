"use client"

import { useState } from "react"
import { MoreVertical, AlertTriangle, ShieldOff, X } from "lucide-react"
import { blockUser } from "@/app/actions/blocks"
import { reportUser } from "@/app/actions/reports"
import { useRouter } from "next/navigation"

const REPORT_REASONS = [
  "Fake or misleading profile",
  "Inappropriate content",
  "Harassment or threatening behavior",
  "Suspected scammer",
  "Selling counterfeit items",
  "Other"
]

export function UserActionMenu({ currentUserId, targetUserId }: { currentUserId: string, targetUserId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()

  const handleBlock = async () => {
    if (confirm("Are you sure you want to block this user?")) {
      await blockUser(currentUserId, targetUserId)
      router.replace("/") // redirect to home since we blocked them
    }
    setIsOpen(false)
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await reportUser(targetUserId, reason, details)
      alert("Report submitted successfully.")
      setIsReportOpen(false)
      setIsOpen(false)
    } catch (err) {
      alert("Failed to submit report.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-95"
        aria-label="More options"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Action Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-5 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-[390px] rounded-[32px] bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:rounded-3xl sm:slide-in-from-bottom-0 sm:fade-in-0">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">User Actions</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsReportOpen(true)
                }}
                className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-left transition-transform active:scale-95"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Report user</p>
                  <p className="text-xs text-muted-foreground">Report inappropriate behavior</p>
                </div>
              </button>

              <button
                onClick={handleBlock}
                className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-left transition-transform active:scale-95"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-destructive shadow-sm">
                  <ShieldOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-destructive">Block user</p>
                  <p className="text-xs text-destructive/80">They won't be able to see you</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[390px] rounded-[32px] bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Report User</h3>
              <button 
                onClick={() => setIsReportOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleReport} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-foreground">Reason</label>
                <select 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-muted p-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  {REPORT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-foreground">Details (Optional)</label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Provide more details..."
                  className="mt-2 w-full min-h-[100px] rounded-2xl bg-muted p-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-brand-gradient text-sm font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
