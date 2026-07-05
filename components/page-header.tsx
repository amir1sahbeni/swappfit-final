"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: ReactNode
}

export function PageHeader({ title, subtitle, back = true, action }: PageHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 -mx-5 mb-4 flex items-center gap-3 border-b border-border bg-card/85 px-5 py-3.5 backdrop-blur-xl">
      {back && (
        <button
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition-transform active:scale-90"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
