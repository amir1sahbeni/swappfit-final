"use client"

import { ChevronRight, Key, UserX, FileText, Download, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"

export default function PrivacySecurityPage() {
  const router = useRouter()

  return (
    <main className="mx-auto w-full max-w-[390px] min-h-dvh bg-background px-5 pb-28 pt-2">
      <PageHeader title="Privacy & Security" subtitle="Manage your account security and data" />

      <div className="mt-6 flex flex-col gap-6">
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">Security</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <button 
              onClick={() => router.replace('/settings/privacy/change-password')}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <Key className="h-[22px] w-[22px] text-primary" />
              <span className="flex-1 truncate text-[15px] font-medium text-foreground">Change password</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </section>

        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">Privacy</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <button 
              onClick={() => router.replace('/settings/privacy/blocked-users')}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <UserX className="h-[22px] w-[22px] text-primary" />
              <span className="flex-1 truncate text-[15px] font-medium text-foreground">Blocked users</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            <button 
              onClick={() => router.replace('/settings/privacy/terms')}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <FileText className="h-[22px] w-[22px] text-primary" />
              <span className="flex-1 truncate text-[15px] font-medium text-foreground">Terms & Conditions</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            <button 
              onClick={() => router.replace('/settings/privacy/privacy-policy')}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <FileText className="h-[22px] w-[22px] text-primary" />
              <span className="flex-1 truncate text-[15px] font-medium text-foreground">Privacy Policy</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </section>

        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C8579]">Data</p>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <button 
              onClick={() => router.replace('/settings/privacy/download-data')}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <Download className="h-[22px] w-[22px] text-primary" />
              <span className="flex-1 truncate text-[15px] font-medium text-foreground">Download my data</span>
            </button>
            <button 
              onClick={() => router.replace('/settings/privacy/delete-account')}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <Trash2 className="h-[22px] w-[22px] text-destructive" />
              <span className="flex-1 truncate text-[15px] font-medium text-destructive">Delete account</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
